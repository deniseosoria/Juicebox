const express = require("express");
const postsRouter = express.Router();


const { requireUser } = require("./utils");

const {
  createPost,
  getAllPosts,
  updatePost,
  getPostById,
  deletePost,
} = require("../db");

postsRouter.get("/", async (req, res, next) => {
  try {
    const allPosts = await getAllPosts();

    const posts = allPosts.filter((post) => {
      // the post is active, doesn't matter who it belongs to
      if (post.active) {
        return true;
      }

      // the post is not active, but it belogs to the current user
      if (req.user && post.author.id === req.user.id) {
        return true;
      }

      // none of the above are true
      return false;
    });

    res.send({
      posts,
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.post("/", requireUser, async (req, res, next) => {
  const { title, content = "", tags = [] } = req.body;

  const postData = {};

  try {
    postData.authorId = req.user.id;
    postData.title = title;
    postData.content = content;

    if (typeof tags === "string") {
      postData.tags = tags
        .trim()
        .split(/\s+/)
        .filter((tag) => tag.length > 0);
    } else {
      postData.tags = tags;
    }

    const post = await createPost(postData);

    if (post) {
      res.send(post);
    } else {
      next({
        name: "PostCreationError",
        message: "There was an error creating your post. Please try again.",
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.patch("/:postId", requireUser, async (req, res, next) => {
  const { postId } = req.params;
  const { title, content, tags } = req.body;

  const updateFields = {};

  if (typeof tags === "string") {
    updateFields.tags = tags
      .trim()
      .split(/\s+/)
      .filter((tag) => tag.length > 0);
    }

  if (title) {
    updateFields.title = title;
  }

  if (content) {
    updateFields.content = content;
  }

  try {
    const originalPost = await getPostById(postId);

    if (originalPost.author.id === req.user.id) {
      const updatedPost = await updatePost(postId, updateFields);
      res.send({ post: updatedPost });
    } else {
      next({
        name: "UnauthorizedUserError",
        message: "You cannot update a post that is not yours",
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.delete("/:postId", async (req, res, next) => {
  try {
    const { postId } = req.params;

    const deletedPost = await deletePost(postId);

    if (deletedPost) {
      res.send({ post: deletedPost });
    } else {
      next({
        name: "PostNotFoundError",
        message: "Post not found.",
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = postsRouter;
