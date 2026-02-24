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
  const toMiB = (bytes) =>
    Math.round((bytes / (1000 * 1000)) * 100) / 100;

  const formatCombinedMiB = (mainBytes = 0, extraBytes = 0) => {
    const total = Number(mainBytes || 0) + Number(extraBytes || 0);
    return `${toMiB(total).toFixed(2)}`;
  };


  // ---------- Stats (total finished + 90 days) ----------
  const totalFinished = useMemo(() => {
    const seen = new Set();
    for (const p of ratio) {
      const key = p.path ?? `${p.name}|${p.createdAt}`;
      if (!seen.has(key)) seen.add(key);
    }
    return seen.size;
  }, [ratio]);

return (
  <>
    {/* Total Projects */}
    <div className="card bg-base-100 shadow-xl border border-base-content/10">
      <div className="card-body">
        <div className="stat-title text-primary font-bold">
          Total Projects
        </div>
        <div className="stat-value text-primary">
          {totalFinished}
        </div>
        <div className="stat-desc font-medium">
          <span className="text-amber-700 font-bold">
            {recentCount}
          </span>{" "}
          projects in the last{" "}
          <span className="text-amber-700 font-bold">90</span> days
        </div>
      </div>
    </div>

    {/* Audit Ratio */}
    <div className="card bg-base-100 shadow-xl border border-base-content/10">
      <div className="card-body">
        <div className="stat-title text-primary font-bold">
          Audit Ratio
        </div>
        <div className="stat-value text-primary">
          {audit.auditRatio?.toFixed(2)}
        </div>
        <div className="stat-desc">Higher is better</div>
      </div>
    </div>

    {/* Audits */}
    <div className="card bg-base-100 shadow-xl border border-base-content/10">
      <div className="card-body">
        <div className="flex items-baseline justify-between">
          <span className="text-primary font-bold">
            Audits Done
          </span>
          <span className="font-mono">
            {formatCombinedMiB(
              audit.totalUp,
              audit.totalUpExtra
            )}{" "}
            MB ↑
          </span>
        </div>

        <progress
          className="progress progress-primary w-full"
          value={audit.totalUp || 0}
          max={(audit.totalUp || 0) + (audit.totalDown || 0) || 1}
        />

        <div className="flex items-baseline justify-between mt-3">
          <span className="text-success font-bold">
            Audits Received
          </span>
          <span className="font-mono">
            {toMiB(audit.totalDown || 0).toFixed(2)} MB ↓
          </span>
        </div>

        <progress
          className="progress progress-success w-full"
          value={audit.totalDown || 0}
          max={(audit.totalUp || 0) + (audit.totalDown || 0) || 1}
        />
      </div>
    </div>
  </>
);

}