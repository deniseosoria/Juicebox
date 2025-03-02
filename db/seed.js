require('dotenv').config({ path: './.env' });

const {
  client,
  createUser,
  updateUser,
  getAllUsers,
  getUserById,
  createPost,
  updatePost,
  getAllPosts,
  getAllTags,
  getPostsByTagName,
} = require("./index");

async function dropTables() {
  try {
    console.log("Starting to drop tables...");

    await client.query(`
      DROP TABLE IF EXISTS post_tags CASCADE;
      DROP TABLE IF EXISTS tags CASCADE;
      DROP TABLE IF EXISTS posts CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log("Finished dropping tables!");
  } catch (error) {
    console.error("Error dropping tables!", error);
    throw error;
  }
}

async function createTables() {
  try {
    console.log("Starting to build tables...");

    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        active BOOLEAN DEFAULT true
      );

      CREATE TABLE posts (
        id SERIAL PRIMARY KEY,
        "authorId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        active BOOLEAN DEFAULT true
      );

      CREATE TABLE tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );

      CREATE TABLE post_tags (
        "postId" INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        "tagId" INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        UNIQUE ("postId", "tagId")
      );
    `);

    console.log("Finished building tables!");
  } catch (error) {
    console.error("Error building tables!", error);
    throw error;
  }
}

async function createInitialUsers() {
  try {
    console.log("Starting to create users...");

    await createUser({
      username: "albert",
      password: "bertie99",
      name: "Al Bert",
      location: "Sydney, Australia",
    });
    await createUser({
      username: "sandra",
      password: "2sandy4me",
      name: "Just Sandra",
      location: "Ain't tellin'",
    });
    await createUser({
      username: "glamgal",
      password: "soglam",
      name: "Joshua",
      location: "Upper East Side",
    });

    console.log("Finished creating users!");
  } catch (error) {
    console.error("Error creating users!", error);
    throw error;
  }
}

async function createInitialPosts() {
  try {
    const [albert, sandra, glamgal] = await getAllUsers();

    console.log("Starting to create posts...");
    await createPost({
      authorId: albert.id,
      title: "First Post",
      content: "This is my first post. I hope I love writing blogs as much as I love writing them.",
      tags: ["#happy", "#youcandoanything"],
    });

    await createPost({
      authorId: sandra.id,
      title: "How does this work?",
      content: "Seriously, does this even do anything?",
      tags: ["#happy", "#worst-day-ever"],
    });

    await createPost({
      authorId: glamgal.id,
      title: "Living the Glam Life",
      content: "Do you even? I swear that half of you are posing.",
      tags: ["#happy", "#youcandoanything", "#canmandoeverything"],
    });

    console.log("Finished creating posts!");
  } catch (error) {
    console.error("Error creating posts!", error);
    throw error;
  }
}

async function rebuildDB() {
  try {
    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitialPosts();
  } catch (error) {
    console.error("Error during rebuildDB!", error);
    throw error;
  }
}

async function testDB() {
  try {
    console.log("Starting to test database...");

    console.log("Calling getAllUsers");
    const users = await getAllUsers();
    console.log("Result:", users);

    console.log("Calling updateUser on users[0]");
    const updateUserResult = await updateUser(users[0].id, {
      name: "Newname Sogood",
      location: "Lesterville, KY",
    });
    console.log("Result:", updateUserResult);

    console.log("Calling getAllPosts");
    const posts = await getAllPosts();
    console.log("Result:", posts);

    console.log("Calling updatePost on posts[0]");
    const updatePostResult = await updatePost(posts[0].id, {
      title: "New Title",
      content: "Updated Content",
    });
    console.log("Result:", updatePostResult);

    console.log("Calling updatePost on posts[1], only updating tags");
    const updatePostTagsResult = await updatePost(posts[1].id, {
      tags: ["#youcandoanything", "#redfish", "#bluefish"],
    });
    console.log("Result:", updatePostTagsResult);

    console.log("Calling getUserById with 1");
    const albert = await getUserById(1);
    console.log("Result:", albert);

    console.log("Calling getAllTags");
    const allTags = await getAllTags();
    console.log("Result:", allTags);

    console.log("Calling getPostsByTagName with #happy");
    const postsWithHappy = await getPostsByTagName("#happy");
    console.log("Result:", postsWithHappy);

    console.log("Finished database tests!");
  } catch (error) {
    console.error("Error during testDB!", error);
    throw error;
  }
}

// Start the database setup process
async function start() {
  try {
    await client.connect(); // Ensure DB connection is established before running anything
    console.log("Connected to database");

    await rebuildDB();
    await testDB();
  } catch (error) {
    console.error("Error in start()", error);
  } finally {
    client.end(); // Close connection after running everything
  }
}

start();
