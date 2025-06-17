import { exec } from "child_process";
import fs from "fs";
import { promisify } from "util";

const execAsync = promisify(exec);

interface BlogPost {
  title: string;
  url: string;
}

async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const feedUrl = "https://spin.atomicobject.com/author/nick-hawn/feed/";
    const { stdout } = await execAsync(
      `curl -s -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" "${feedUrl}"`
    );

    const posts = parseRssFeed(stdout);
    return posts;
  } catch (error) {
    console.error("Error fetching RSS feed:", error);
    return [];
  }
}

function parseRssFeed(xml: string): BlogPost[] {
  const posts: BlogPost[] = [];

  // Extract items from RSS feed
  const itemPattern = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemPattern.exec(xml)) !== null) {
    const itemContent = match[1];

    // Extract title - titles are plain text, not CDATA
    const titleMatch = itemContent.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Extract link
    const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
    const url = linkMatch ? linkMatch[1].trim() : "";

    if (title && url) {
      posts.push({ title, url });
    }
  }

  return posts;
}

function generateReadme(posts: BlogPost[]): string {
  const boilerplate = `Hi, I'm Nick Hawn. I'm a Software Developer based in Grand Rapids, Michigan. Currently working at [@atomicobject](https://github.com/atomicobject) as a Software Developer & Consultant.

**Latest Blog Posts**

`;

  let blogSection = "";
  const latestPosts = posts.slice(0, 5);

  latestPosts.forEach((post) => {
    blogSection += `- [${post.title}](${post.url})\n`;
  });

  if (latestPosts.length === 0) {
    blogSection = "- No blog posts found at the moment.\n";
  } else {
    blogSection +=
      "- [View all posts →](https://spin.atomicobject.com/author/nick-hawn/)\n";
  }

  return boilerplate + blogSection;
}

async function main(): Promise<void> {
  try {
    console.log("Fetching blog posts...");
    const posts = await fetchBlogPosts();
    console.log(`Found ${posts.length} blog posts`);

    const readmeContent = generateReadme(posts);

    fs.writeFileSync("readme.md", readmeContent);
    console.log("readme.md updated successfully!");
  } catch (error) {
    console.error("Error generating readme.md:", error);
    process.exit(1);
  }
}

main();
