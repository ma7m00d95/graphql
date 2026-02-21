import { request, gql } from 'graphql-request';
const GQL_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';
export const FetchUser = () => {
  const token = localStorage.getItem('token');

  const query = gql`
    query {
      user {
        id
        login
        attrs
      }
    }
  `;

  // Use Bearer token for GraphQL, NOT Basic Auth
  return request(GQL_URL, query, {}, {
    Authorization: `Bearer ${token}`
  }).then(data =>{
  console.log("Fetch User Details")
  return data
  });

}
