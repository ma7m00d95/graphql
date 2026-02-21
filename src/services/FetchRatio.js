import { request, gql } from 'graphql-request';
const GQL_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

const MONTHLY_XP_RAW_NULLABLE = gql`
  query MonthlyXP_Raw_Nullable($userId: Int!, $start: timestamptz, $end: timestamptz) {
    transaction(
      where: {
        progress: { user: { id: { _eq: $userId } } }
        _and: [
          { createdAt: { _gte: $start } }
          { createdAt: { _lt:  $end   } }
        ]
      }
      order_by: { createdAt: asc }
    ) {
      amount
      isBonus
      createdAt
    }
  }
`;
const FailVsPassPer_NULLABLE = gql`
query FailVsPassPerProject(
  $start: timestamptz
  $end: timestamptz
  $limit: Int = 100
) {
  object(
    where: { type: { _eq: "project" } }
    order_by: { name: asc }
    limit: $limit
  ) {
    id
    name

    # Total progress rows (optional)
    total: progresses_aggregate(
      where: {
        updatedAt: { _gte: $start, _lt: $end }
      }
    ) {
      aggregate { count }
    }

    # Pass (grade >= 1)
    pass: progresses_aggregate(
      where: {
        updatedAt: { _gte: $start, _lt: $end }
        grade: { _gte: 1 }
      }
    ) {
      aggregate { count }
    }

    # Fail (grade < 1)
    fail: progresses_aggregate(
      where: {
        updatedAt: { _gte: $start, _lt: $end }
        grade: { _lt: 1 }
      }
    ) {
      aggregate { count }
    }
  }
}
`;
const RankUsersByAudits_NULLABLE = gql`
query RankUsersByAuditsDone(
  $start: timestamptz
  $end: timestamptz
  $limit: Int = 10
) {
  user(
    order_by: { audits_aggregate: { count: desc } }
    limit: $limit
  ) {
    id
    login
    auditsCount: audits_aggregate(
      where: {
        createdAt: { _gte: $start, _lt: $end }
      }
    ) {
      aggregate { count }
    }
  }
}
`;
const RankUsersByProjectsCompleted_NULLABLE = gql`

query RankUsersByProjectsCompleted(
  $start: timestamptz
  $end: timestamptz
  $limit: Int = 10
) {
  user(
    order_by: { progresses_aggregate: { count: desc } }
    limit: $limit
  ) {
    id
    login
    completedCount: progresses_aggregate(
      where: {
        isDone: { _eq: true }
        updatedAt: { _gte: $start, _lt: $end }
      }
    ) {
      aggregate { count }
    }
  }
}
`;

export const FetchRatio = async (start =null , end  =null) => {
  const token = localStorage.getItem('token');
  const userID = localStorage.getItem('userId')
  if (!token) throw new Error('Missing auth token');
  const toISO = (d) => (d instanceof Date ? d.toISOString() : (d || null));
  const variables = {
    userId:userID,
    start: toISO(start),
    end: toISO(end),
  };
  console.log("Fetch Ratio")
  return request(
    GQL_URL,
    MONTHLY_XP_RAW_NULLABLE,
    variables,
    { Authorization: `Bearer ${token}` }
  );
  

}
