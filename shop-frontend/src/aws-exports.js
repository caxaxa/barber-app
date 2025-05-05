const awsmobile = {
    Auth: {
      region: process.env.REACT_APP_AWS_REGION,
      userPoolId: process.env.REACT_APP_USER_POOL_ID,
      userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
    },
    API: {
      endpoints: [
        {
          name: "BarberApi",
          endpoint: process.env.REACT_APP_API_URL,
          custom_header: async () => {
            // will be filled in by aws-amplify based on Auth above
            return {};
          }
        }
      ]
    }
  };
  
  export default awsmobile;
  