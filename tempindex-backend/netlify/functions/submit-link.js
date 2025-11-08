const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.GITHUB_PAT;
  const repoOwner = 'vineetkum25softwork';  // Replace with your username
  const repo = 'TempIndex';       // Replace with your repo name
  const filePath = 'links.json';
  const branch = 'main';

  try {
    const data = JSON.parse(event.body);
    const { url, title, description } = data;

    if (!url || !title || !description) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing required fields.' }) };
    }
    if (title.trim().split(/\s+/).length > 20) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Title exceeds word limit.' }) };
    }
    if (description.trim().split(/\s+/).length > 100) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Description exceeds word limit.' }) };
    }

    // Get current links.json content
    const getResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repo}/contents/${filePath}?ref=${branch}`, {
      headers: { Authorization: `token ${token}` }
    });

    if (!getResponse.ok) {
      return { statusCode: 500, body: JSON.stringify({ message: 'Failed to fetch links.json' }) };
    }

    const fileData = await getResponse.json();
    const content = Buffer.from(fileData.content, 'base64').toString();
    const links = JSON.parse(content);

    links.push({
      url,
      title,
      description,
      created_time: new Date().toISOString()
    });

    const updatedContent = Buffer.from(JSON.stringify(links, null, 2)).toString('base64');

    // Update the file on GitHub
    const putResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Add link: ${title}`,
        content: updatedContent,
        sha: fileData.sha,
        branch
      })
    });

    if (!putResponse.ok) {
      return { statusCode: 500, body: JSON.stringify({ message: 'Failed to update links.json' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Link submitted successfully.' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Server error', error: error.message }) };
  }
};
