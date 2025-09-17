import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approveAccessRequest, fetchPendingAccessRequests, rejectAccessRequest } from '../api';

export default function AdminApprovals() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['access-requests'], queryFn: fetchPendingAccessRequests });
  const mApprove = useMutation({
    mutationFn: (id: string) => approveAccessRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['access-requests'] })
  });
  const mReject = useMutation({
    mutationFn: (id: string) => rejectAccessRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['access-requests'] })
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {(data ?? []).map(req => (
        <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #333', padding: 8, borderRadius: 8 }}>
          <div>
            <div><strong>Request</strong> {req.id}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{req.user_id} → {req.team_id}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => mApprove.mutate(req.id)}>Approve</button>
            <button onClick={() => mReject.mutate(req.id)}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}


