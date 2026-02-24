import { request, gql } from 'graphql-request';
const GQL_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

export const FetchMyCohort = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Missing token");

  const query = gql`
    query GetMyCohortByPath($path: String!) {
      user {
        login
        events(
          where: {
            event: { path: { _eq: $path } }
          }
        ) {
          level
          event {
            id
            path
            cohorts {
              id
              name
            }
          }
        }
      }
    }
  `;

  try {
    const data = await request(
      GQL_URL,
      query,
      { path: "/bahrain/bh-module" },
      { Authorization: `Bearer ${token}` }
    );
    return data.user[0].events[0].event.id;

  } catch (err) {
    console.error("❌ GraphQL ERROR:", err);
    throw err;
  }
};
