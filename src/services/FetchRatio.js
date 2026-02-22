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
