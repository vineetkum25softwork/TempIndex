const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.GITHUB_PAT;
  const repoOwner = 'vineetkum25softwork'; // replace with your GitHub username
  const repo = 'TempIndex'; // replace with your repository name
  const filePath = 'links.json';
  const branch = 'main'; // or your default branch

  try {
    const data = JSON.parse(event.body);
    const { url, title, description } = data;

    // Input validation
    if (!url || !title || !description) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing URL, title, or description.' }) };
    }
    if (!/^https?:\/\//.test(url)) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Invalid URL format.' }) };
    }
    if (title.trim().split(/\s+/).length > 20) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Title exceeds 20 words.' }) };
    }
    if (description.trim().split(/\s+/).length > 100) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Description exceeds 100 words.' }) };
    }

    // Fetch current links.json from GitHub
    const getRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repo}/contents/${filePath}?ref=${branch}`, {
      headers: { Authorization: `token ${token}` }
    });
    if (!getRes.ok) {
      return { statusCode: 500, body: JSON.stringify({ message: 'Error fetching links.json from GitHub' }) };
    }
    const fileData = await getRes.json();
    const contentStr = Buffer.from(fileData.content, 'base64').toString();
    const links = JSON.parse(contentStr);

    // Append new submission with created_time
    links.push({
      url,
      title,
      description,
      created_time: new Date().toISOString()
    });

    // Prepare base64-encoded updated content
    const updatedContent = Buffer.from(JSON.stringify(links, null, 2)).toString('base64');

    // Commit updated links.json back to GitHub
    const putRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: { Authorization: `token ${token}` },
      body: JSON.stringify({
        message: `Add link: ${title}`,
        content: updatedContent,
        sha: fileData.sha,
        branch
      })
    });

    if (!putRes.ok) {
      return { statusCode: 500, body: JSON.stringify({ message: 'Error committing updated links.json' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Link submitted successfully' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Server error', error: error.message }) };
  }
};
