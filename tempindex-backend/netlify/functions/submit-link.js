const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({ auth: process.env.GITHUB_PAT });

const owner = "vineetkum25softwork";  // Replace with your GitHub username
const repo = "Tindex";              // Replace with your repo name
const path = "links.json";             // File path in the repo
const branch = "main";                 // Branch where the file lives

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Method Not Allowed" })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { url, title, description } = data;

    if (!url || !title || !description) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Missing required fields" })
      };
    }

    // Get the current file info and content
    const { data: fileData } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    const content = Buffer.from(fileData.content, "base64").toString();
    const links = JSON.parse(content);

    // Append new link
    links.push({ url, title, description, date: new Date().toISOString() });

    // Prepare updated content in base64
    const updatedContent = Buffer.from(JSON.stringify(links, null, 2)).toString("base64");

    // Commit updated file back to GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: "Add new link via Netlify function",
      content: updatedContent,
      sha: fileData.sha,
      branch,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ message: "Link submitted successfully" })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Internal Server Error", error: error.message })
    };
  }
};
