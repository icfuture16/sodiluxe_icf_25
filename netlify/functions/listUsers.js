const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Infos depuis infos_utiles.txt
  const PROJECT_ID = '6856f8aa00281cb47665';
  const API_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
  const API_KEY = 'standard_4c24e91366984ffd2c2c09a0ed2d3527382fde636b7ea60c867a10467fb58ec942be378668988ad3cdc4993bf2f6839e75a7467b0771f3c8e899d0f1b3b063946c7ef195972d58310ccbbf899423fdd94ceda4b1e3a88c8c691d716e105890966f552b942cdf76360ae311305dae2559d92afe1ab64367f927af580263d63dc2';

  try {
    const response = await fetch(`${API_ENDPOINT}/users?limit=100`, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': API_KEY
      }
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Invalid JSON response from Appwrite', raw: text })
      };
    }

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data, raw: text })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        users: (data.users || []).map(u => ({
          $id: u.$id,
          name: u.name,
          email: u.email
        }))
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
