import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { CheckCircle, ChevronRight, Loader2 } from 'lucide-react';

interface Field { name: string; label: string; type: string; }
interface Option { id: string; label: string; value: string; }
interface DialogNode {
  id: string; key: string; type: 'TEXT' | 'QUESTION' | 'FORM' | 'DECISION';
  title: string; content?: { text?: string; schema?: { fields: Field[] } };
  options: Option[];
}

interface Props {
  flowKey: string;
  patientId?: string;
  onComplete?: (context: Record<string, unknown>) => void;
}

export default function DialogPlayer({ flowKey, patientId, onComplete }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [node, setNode] = useState<DialogNode | null>(null);
  const [context, setContext] = useState<Record<string, unknown>>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [history, setHistory] = useState<DialogNode[]>([]);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.post(`/dialogs/${flowKey}/start`, { patientId, context: {} });
      const { session, node: firstNode } = res.data.data;
      setSessionId(session.id);
      setNode(firstNode);
      setHistory([]);
      setCompleted(false);
    } finally {
      setLoading(false);
    }
  }, [flowKey, patientId]);

  useEffect(() => { start(); }, [start]);

  const advance = async (choiceValue?: string, formData?: Record<string, unknown>) => {
    if (!sessionId || !node) return;
    setLoading(true);
    try {
      const newCtx = { ...context, ...(formData || {}) };
      setContext(newCtx);
      setHistory((h) => [...h, node]);

      const res = await api.post(`/dialogs/${flowKey}/next`, {
        sessionId,
        choiceValue: choiceValue ?? null,
        formData: formData ?? null,
      });
      const { node: nextNode, completed: done, context: updatedCtx } = res.data.data;
      setContext(updatedCtx);

      if (done || !nextNode) {
        setCompleted(true);
        onComplete?.(updatedCtx);
      } else {
        setNode(nextNode);
        setFormValues({});
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    advance(undefined, formValues as Record<string, unknown>);
  };

  if (loading && !node) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (completed) {
    return (
      <div className="text-center py-10">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
        <h3 className="font-semibold text-lg text-gray-900">Hoàn thành</h3>
        <p className="text-gray-500 text-sm mt-1">Thông tin đã được ghi nhận thành công.</p>
        <button onClick={start} className="btn-secondary mt-4 text-sm">Bắt đầu lại</button>
      </div>
    );
  }

  if (!node) return null;

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress breadcrumb */}
      {history.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-4 flex-wrap">
          {history.map((h, i) => (
            <span key={i} className="flex items-center gap-1">
              <span>{h.title}</span>
              <ChevronRight size={12} />
            </span>
          ))}
          <span className="text-primary font-medium">{node.title}</span>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-1">{node.title}</h3>

        {/* TEXT node */}
        {node.type === 'TEXT' && (
          <div>
            <p className="text-gray-600 text-sm mt-2 mb-6">{node.content?.text}</p>
            <button onClick={() => advance()} disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Tiếp tục'}
            </button>
          </div>
        )}

        {/* QUESTION node */}
        {node.type === 'QUESTION' && (
          <div>
            {node.content?.text && <p className="text-gray-600 text-sm mt-2 mb-4">{node.content.text}</p>}
            <div className="space-y-2">
              {node.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => advance(opt.value)}
                  disabled={loading}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary-light transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FORM node */}
        {node.type === 'FORM' && (
          <form onSubmit={handleFormSubmit} className="mt-3 space-y-3">
            {node.content?.schema?.fields?.map((field) => (
              <div key={field.name}>
                <label className="label">{field.label}</label>
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  className="input"
                  value={formValues[field.name] || ''}
                  onChange={(e) => setFormValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  required
                />
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Gửi'}
            </button>
          </form>
        )}

        {/* DECISION node — auto-evaluate on render */}
        {node.type === 'DECISION' && (
          <div>
            <p className="text-gray-500 text-sm mt-2 mb-4">Đang phân tích điều kiện...</p>
            <button onClick={() => advance()} disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Tiếp tục'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
