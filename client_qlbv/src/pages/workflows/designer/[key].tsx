import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Save, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import { useForm } from 'react-hook-form';
import { useOpenDialog } from '@/store/entityDialogStore';

// Dynamic import to avoid SSR issues with react-flow
const ReactFlow = dynamic(() => import('reactflow').then(m => m.default), { ssr: false });
const Background = dynamic(() => import('reactflow').then(m => m.Background), { ssr: false });
const Controls = dynamic(() => import('reactflow').then(m => m.Controls), { ssr: false });
const MiniMap = dynamic(() => import('reactflow').then(m => m.MiniMap), { ssr: false });

import 'reactflow/dist/style.css';

const NODE_COLORS: Record<string, string> = {
  TEXT: '#6366f1', DIALOG: '#0ea5e9', FORM: '#10b981',
  DECISION: '#f59e0b', PAGE: '#8b5cf6', ACTION: '#ef4444',
};

interface RFNode { id: string; data: { label: string; type: string; nodeData: Record<string, unknown> }; position: { x: number; y: number }; style?: Record<string, unknown>; }
interface RFEdge { id: string; source: string; target: string; label?: string; animated?: boolean; }

export default function FlowDesignerPage() {
  const router = useRouter();
  const { key } = router.query as { key: string };
  const [nodes, setNodes] = useState<RFNode[]>([]);
  const [edges, setEdges] = useState<RFEdge[]>([]);
  const [workflow, setWorkflow] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  const openDialog = useOpenDialog();

  useEffect(() => {
    if (!key) return;
    api.get(`/workflows/${key}`).then((res) => {
      const wf = res.data.data;
      setWorkflow(wf);
      const rfNodes: RFNode[] = (wf.nodes || []).map((n: Record<string, unknown>) => ({
        id: n.id as string,
        data: { label: n.title as string, type: n.type as string, nodeData: n },
        position: { x: (n.posX as number) || Math.random() * 500, y: (n.posY as number) || Math.random() * 300 },
        style: { background: NODE_COLORS[n.type as string] || '#64748b', color: '#fff', borderRadius: 8, padding: '8px 16px', border: 'none', fontWeight: 600, fontSize: 13 },
      }));
      const rfEdges: RFEdge[] = (wf.edges || []).map((e: Record<string, unknown>) => ({
        id: e.id as string,
        source: e.fromNodeId as string,
        target: e.toNodeId as string,
        label: (e.condition || e.label) as string | undefined,
        animated: true,
      }));
      setNodes(rfNodes);
      setEdges(rfEdges);
    }).catch(() => toast.error('Không tải được workflow'));
  }, [key]);

  const onNodesChange = useCallback((changes: unknown[]) => {
    setNodes((nds) => {
      const updated = [...nds];
      (changes as Array<{ type: string; id: string; position?: { x: number; y: number } }>).forEach((c) => {
        if (c.type === 'position' && c.position) {
          const idx = updated.findIndex((n) => n.id === c.id);
          if (idx !== -1) updated[idx] = { ...updated[idx], position: c.position! };
        }
        if (c.type === 'remove') {
          const idx = updated.findIndex((n) => n.id === c.id);
          if (idx !== -1) updated.splice(idx, 1);
        }
      });
      return updated;
    });
  }, []);

  const onEdgesChange = useCallback((changes: unknown[]) => {
    setEdges((eds) => {
      const updated = [...eds];
      (changes as Array<{ type: string; id: string }>).forEach((c) => {
        if (c.type === 'remove') {
          const idx = updated.findIndex((e) => e.id === c.id);
          if (idx !== -1) updated.splice(idx, 1);
        }
      });
      return updated;
    });
  }, []);

  const onConnect = useCallback((connection: { source: string; target: string }) => {
    setEdges((eds) => [...eds, { id: `e-${Date.now()}`, source: connection.source, target: connection.target, animated: true }]);
  }, []);

  const savePositions = async () => {
    setSaving(true);
    try {
      await api.put('/workflows/positions', {
        nodes: nodes.map((n) => ({ id: n.id, posX: n.position.x, posY: n.position.y })),
      });
      toast.success('Đã lưu vị trí nodes');
    } catch { toast.error('Lưu thất bại'); }
    finally { setSaving(false); }
  };

  const onNodeClick = useCallback((_: unknown, node: RFNode) => {
    // Open inline node inspector dialog
    openDialog('workflow_node', node.id, 'edit', { nodeKey: node.data.nodeData.key, nodeTitle: node.data.label });
  }, [openDialog]);

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/workflows" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Flow Designer — {(workflow?.title as string) || key}</h1>
          <p className="text-xs text-gray-400 mt-0.5">Keo tha de sap xep nodes. Click node de mo inspector.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowNodeModal(true)} className="btn-secondary flex items-center gap-2 text-sm"><Plus size={14} />Thêm node</button>
          <button onClick={savePositions} disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
            <Save size={14} />{saving ? 'Đang lưu...' : 'Lưu vị trí'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-3 flex-wrap">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded" style={{ background: color }} />
            <span className="text-gray-500">{type}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 600 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange as never}
          onEdgesChange={onEdgesChange as never}
          onConnect={onConnect as never}
          onNodeClick={onNodeClick as never}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Node inspector opens as EntityDialog on click */}

      <Modal open={showNodeModal} onClose={() => setShowNodeModal(false)} title="Them node moi">
        <p className="text-sm text-gray-500 mb-4">De them node, hay chinh sua workflow JSON tu trang quan ly va re-deploy. Tinh nang them node truc tiep dang phat trien.</p>
        <Link href="/workflows" className="btn-primary block text-center">Ve trang quan ly</Link>
      </Modal>
    </Layout>
  );
}
