import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/axios';
import { CheckCircle, Loader2, ChevronRight, ArrowRight } from 'lucide-react';

interface WFNode {
  id: string; key: string;
  type: 'PAGE' | 'DIALOG' | 'FORM' | 'DECISION' | 'TEXT' | 'ACTION';
  title: string;
  config?: {
    text?: string; route?: string;
    schema?: { fields: Array<{ name: string; label: string; type: string; required?: boolean; options?: string[] }> };
  };
  options?: Array<{ id: string; label: string; value: string }>;
}

interface Props {
  workflowKey: string;
  patientId?: string;
  initialContext?: Record<string, unknown>;
  onComplete?: (ctx: Record<string, unknown>) => void;
}

export default function WorkflowRenderer({ workflowKey, patientId, initialContext = {}, onComplete }: Props) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [node, setNode] = useState<WFNode | null>(null);
  const [context, setContext] = useState<Record<string, unknown>>(initialContext);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.post(`/workflows/${workflowKey}/start`, { patientId, context: initialContext });
      const { sessionId: sid, node: firstNode, context: ctx } = res.data.data;
      setSessionId(sid);
      setContext(ctx || initialContext);
      setCompleted(false);
      setBreadcrumb([]);
      handleNode(firstNode, ctx || initialContext);
    } finally {
      setLoading(false);
    }
  }, [workflowKey, patientId]);

  useEffect(() => { start(); }, [start]);

  const handleNode = (n: WFNode | null, ctx: Record<string, unknown>) => {
    if (!n) { setCompleted(true); onComplete?.(ctx); return; }
    if (n.type === 'PAGE' && n.config?.route) {
      router.push(n.config.route);
      return;
    }
    if (n.type === 'ACTION') {
      // Auto-advance action nodes
      setNode(n);
      return;
    }
    setNode(n);
    setFormValues({});
  };

  const advance = async (choiceValue?: string, formData?: Record<string, unknown>) => {
    if (!sessionId || !node) return;
    setLoading(true);
    try {
      const newCtx = { ...context, ...(formData || {}) };
      setContext(newCtx);
      setBreadcrumb((b) => [...b, node.title]);

      const res = await api.post(`/workflows/${workflowKey}/next`, {
        sessionId, choiceValue: choiceValue ?? null, formData: formData ?? null,
      });
      const { node: nextNode, completed: done, context: updatedCtx } = res.data.data;
      setContext(updatedCtx || newCtx);

      if (done || !nextNode) {
        setCompleted(true);
        onComplete?.(updatedCtx || newCtx);
      } else {
        handleNode(nextNode, updatedCtx || newCtx);
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
    return <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  if (completed) {
    return (
      <div className="text-center py-12">
        <CheckCircle size={52} className="text-green-500 mx-auto mb-4" />
        <h3 className="font-bold text-xl text-gray-900">Hoàn thành</h3>
        <p className="text-gray-500 mt-2">Luồng xử lý đã hoàn tất.</p>
        <button onClick={start} className="btn-secondary mt-4 text-sm">Bắt đầu lại</button>
      </div>
    );
  }

  if (!node) return null;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-400 flex-wrap">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              <span>{b}</span><ChevronRight size={10} />
            </span>
          ))}
          <span className="text-primary font-medium">{node.title}</span>
        </div>
      )}

      <div className="card">
        {/* Node type badge */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">{node.title}</h3>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">{node.type}</span>
        </div>

        {/* TEXT */}
        {node.type === 'TEXT' && (
          <div>
            <p className="text-gray-600 text-sm mb-5">{node.config?.text}</p>
            <button onClick={() => advance()} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <><span>Tiếp tục</span><ArrowRight size={16} /></>}
            </button>
          </div>
        )}

        {/* DIALOG / QUESTION */}
        {(node.type === 'DIALOG' || node.type === 'DECISION') && (
          <div>
            {node.config?.text && <p className="text-gray-600 text-sm mb-4">{node.config.text}</p>}
            <div className="space-y-2">
              {node.options?.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => advance(opt.value)}
                  disabled={loading}
                  className="w-full text-left px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary-light transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-between group"
                >
                  <span>{opt.label}</span>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FORM */}
        {node.type === 'FORM' && (
          <form onSubmit={handleFormSubmit} className="space-y-3">
            {node.config?.schema?.fields?.map((field) => (
              <div key={field.name}>
                <label className="label">{field.label}{field.required && <span className="text-red-500 ml-1">*</span>}</label>
                {field.options ? (
                  <select className="input" value={formValues[field.name] || ''} onChange={(e) => setFormValues((v) => ({ ...v, [field.name]: e.target.value }))} required={field.required}>
                    <option value="">-- Chọn --</option>
                    {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    className="input"
                    value={formValues[field.name] || ''}
                    onChange={(e) => setFormValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    required={field.required}
                  />
                )}
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Gửi'}
            </button>
          </form>
        )}

        {/* ACTION — auto advance */}
        {node.type === 'ACTION' && (
          <div>
            <p className="text-gray-500 text-sm mb-4">Đang thực hiện hành động...</p>
            <button onClick={() => advance()} disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Tiếp tục'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
