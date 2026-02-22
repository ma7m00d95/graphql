// services/FetchGrades.js
import { request, gql } from 'graphql-request';
import React, { useState, useMemo, useEffect } from 'react';

const GQL_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

const XP_QUERY = gql`
  query GetProjectXP_Fixed {
    transaction(
      where: {
        _and: [
          { _or: [{ type: { _eq: "xp" } }, { type: { _eq: "XP" } }] },
          { object: { type: { _eq: "project" } } }
        ]
      },
      order_by: { createdAt: desc }
    ) {
      amount
      createdAt
      path
      object { name }
    }
    transaction_aggregate(
      where: {
        _and: [
          { _or: [{ type: { _eq: "xp" } }, { type: { _eq: "XP" } }] },
          { object: { type: { _eq: "project" } } }
        ]
      }
    ) {
      aggregate { sum { amount } }
    }
  }
`;

export const FetchData = async () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  try {
    // Correct signature for graphql-request
    const data = await request(
      GQL_URL,
      XP_QUERY,
      undefined,
      token ? { Authorization: `Bearer ${token}` } : undefined
    );
    return data;
  } catch (error) {
    console.error("GraphQL Error:", error);
    throw error;
  }
};

const AUDIT_QUERY = gql`
  query GetAuditRatio {
    user {
      login
      auditRatio
      totalUp
      totalDown
    }
  }
`;

export async function fetchAuditRatio() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return request(
    GQL_URL,
    AUDIT_QUERY,
    undefined,
    token ? { Authorization: `Bearer ${token}` } : undefined
  );
}


export const RatioComponent = ({
  ratio = [],
  audit = {},
  recentCount = 0
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const toMiB = (bytes) =>
    Math.round((bytes / (1000 * 1000)) * 100) / 100;

  const formatCombinedMiB = (mainBytes = 0, extraBytes = 0) => {
    const total = Number(mainBytes || 0) + Number(extraBytes || 0);
    return `${toMiB(total).toFixed(2)}`;
  };
  // ---------- Sorting ----------
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedData = [...(ratio || [])].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const { key, direction } = sortConfig;
    const dir = direction === 'asc' ? 1 : -1;

    const aVal = a[key];
    const bVal = b[key];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return -1 * dir;
    if (bVal == null) return 1 * dir;

    if (key === 'amountMB') return (aVal - bVal) * dir; // numeric
    if (key === 'createdAt') return (new Date(aVal).getTime() - new Date(bVal).getTime()) * dir; // date
    return String(aVal).localeCompare(String(bVal)) * dir; // name/status
  });

  // ---------- Stats (total finished + 90 days) ----------
  const totalFinished = useMemo(() => {
    const seen = new Set();
    for (const p of ratio) {
      const key = p.path ?? `${p.name}|${p.createdAt}`;
      if (!seen.has(key)) seen.add(key);
    }
    return seen.size;
  }, [ratio]);


  return (<div className="card-body">
    <div className="card-body p-4 items-center">
      <h2 className="card-title text-primary tracking-tighter uppercase text-xl font-black mb-2">
        Projects
      </h2>
    </div>
    <div className="overflow-x-auto max-h-60 overflow-y-auto rounded-box border border-base-300">

      <table className="table table-zebra w-full table-fixed">
        <thead>
          <tr className="cursor-pointer select-none">
            <th onClick={() => requestSort('name')}>
              Project Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => requestSort('amountMB')}>
              XP {sortConfig.key === 'amountMB' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => requestSort('createdAt')}>
              Created {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>


        <tbody>
          {sortedData.map((item, index) => (
            <tr key={index}>
              <td className="font-bold text-primary">{item.name}</td>

              <td>
                <span className="inline-flex items-center badge badge-ghost font-mono whitespace-nowrap">
                  {item.amountMB}MB
                </span>
              </td>

              <td className="max-w-0">
                <span
                  className="
              inline-flex items-center rounded-box bg-base-200
              px-2 py-1 font-mono text-sm
              whitespace-nowrap overflow-hidden text-ellipsis
              max-w-full
            "
                  title={item.created}
                >
                  {item.created || '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>

    {/* >>> NEW: Replace the two circles with useful stats <<< */}
    {/* Stats row — responsive */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">

      {/* Total Projects */}
      <div className="stats shadow border border-base-content/10 h-full min-w-0 order-1">
        <div className="stat">
          <div className="stat-title text-primary font-bold">Total Projects</div>
          <div className="stat-value text-primary">{totalFinished}</div>
          <div className="stat-desc font-medium">
            <span className="text-amber-700 font-bold">{recentCount}</span> projects in the last <span className="text-amber-700 font-bold">90</span> days
          </div>
        </div>
      </div>

      {/* Audit Ratio */}
      <div className="stats shadow border border-base-content/10 h-full min-w-0 order-2">
        <div className="stat">
          <div className="stat-title text-primary font-bold">Audit Ratio</div>
          <div className="stat-value text-primary">{audit.auditRatio.toFixed(2)}</div>
          <div className="stat-desc">Higher is better</div>
        </div>
      </div>

      {/* Audits card — full width under the first two on md; goes back to one column on xl */}
      <div
        className="
      card bg-base-100 shadow border border-base-content/10 h-full min-w-0
      md:col-span-2 xl:col-span-1
      md:order-last
    "
      >
        <div className="card-body">

          {/* Audits Done */}
          <div className="flex items-baseline justify-between">
            <span className="text-primary font-bold">Audits Done</span>
            <span className="font-mono">
              {formatCombinedMiB(audit.totalUp, audit.totalUpExtra)} MB <span className="opacity-70">↑</span>
            </span>
          </div>

          {(() => {
            // Use actual MiB for bars (not percent)
            const toMiB = (bytes) => Math.round((bytes / (1000 * 1000)) * 100) / 100;
            const upMiB = toMiB((audit.totalUp || 0) + (audit.totalUpExtra || 0));
            const downMiB = toMiB(audit.totalDown || 0);
            const totalMiB = upMiB + downMiB;
            const max = totalMiB > 0 ? totalMiB : 1;

            return (
              <>
                <progress className="progress progress-primary w-full" value={totalMiB > 0 ? upMiB : 0} max={max} />

                {/* Audits Received */}
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-success font-bold">Audits Received</span>
                  <span className="font-mono">
                    {toMiB(audit.totalDown).toFixed(2)} MB <span className="opacity-70">↓</span>
                  </span>
                </div>
                <progress className="progress progress-success w-full" value={totalMiB > 0 ? downMiB : 0} max={max} />
              </>
            );
          })()}
        </div>
      </div>

    </div>

  </div>
  )
}