import { request, gql } from 'graphql-request';
const GQL_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

const query = gql`query GetProjectAttempts($limit: Int!, $orderBy: [progress_order_by!]) {
      progress(
        where: {
          object: {type: {_eq: "project"}},
        }
        distinct_on: [objectId]
        order_by: $orderBy
        limit: $limit
      ) {
        grade
        isDone
        updatedAt
        object {
          name
          progresses_aggregate {
            aggregate { count }
          }
        }
      }
    }`;

export const FetchData = async (limit = 500, orderDir = "desc") => {
  const token = localStorage.getItem('token');
      // Define the actual values here
  const variables = {
    limit: limit,
    // The enum must be the value itself (desc/asc), not a number.
    orderBy: [
      { objectId: "asc" },
      { updatedAt: orderDir }
    ]
  };

  // Using the options object format (Recommended for v6+)
  const data = await request({
    url: GQL_URL,
    document: query,
    variables: variables,
    requestHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  console.log("Fetch Grades")

return data;
}
