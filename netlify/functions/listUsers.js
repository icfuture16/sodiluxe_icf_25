const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Infos depuis infos_utiles.txt
  const PROJECT_ID = '68bf1c29001d20f7444d';
  const API_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
  const API_KEY = 'standard_bc56551b8743243f64bfc458f7e3fe88a1490354673bab3a831c43bb52ad30d0bc68ec5a98bacbc3606276ff185fabdb977e7dbc1e71c915256cc5c8e2fe6413c12a8301e263ccf0a013357b429d9eac807bc1fa5a8683046782e996c12ea97f3a044f0147f3f664bdf3fdb3d6aca169238c07a2fd23028ee04e6d18a5de39eb';

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

