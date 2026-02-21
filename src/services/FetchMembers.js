import { request, gql } from 'graphql-request';
const GQL_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';


const CAPTAIN_MEMBER = gql`
query GetGroupsByCaptain($username: String!) {
  transaction(where: {
    progress: {
      group: {
        captain: { login: { _eq: $username } }
      }
    }
  }) {
    progress {

      group {
        id
        captain {
          login
          firstName
        }
        members {
          user {
            login
            firstName
            lastName
          }
        }
      }
      object{
        name
      }
    }
  }
}
`

export const FetchMembers = async () => {
  const username = localStorage.getItem('username');

  const token = localStorage.getItem('token');

  if (!token) throw new Error('Missing auth token');
  const variables = {
    username,
  };
  console.log("Fetch Members")

  return request(
    GQL_URL,
    CAPTAIN_MEMBER,
    variables,
    { Authorization: `Bearer ${token}` }
  );


}
