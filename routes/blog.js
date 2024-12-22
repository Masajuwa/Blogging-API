const express = require("express")
const jwt = require("jsonwebtoken")
const authorizeBlogOwner = require("../authentication/authUser")
const blogController = require("../controllers/blogCtrler");
const authenticateJWT = require("../authentication/authenticate")
const articleRouter = express.Router()

articleRouter.get("/published", blogController.getAllPublishedArticles)

// articleRouter.get("/:id", blogController.getOneArticle)
articleRouter.get("/blogger", authenticateJWT,
  blogController.getLoggedOnUserWelcomePage
)

articleRouter.get("/my-articles", authenticateJWT,
    blogController.getListofArticlesForAnAuthor
)

articleRouter.get("/createArticle", authenticateJWT,
    (req, res) => {
        res.render('createArticle', { user: req.user });
    }
);

articleRouter.get("/:id", blogController.getBlogById)

articleRouter.get("/:id/updateArticle", authenticateJWT, authorizeBlogOwner,
   blogController.editContent
)
articleRouter.post("/create", authenticateJWT,
    blogController.createArticle
)

articleRouter.put("/:id/update",
    blogController.updateArticle
)

articleRouter.delete("/:id", authenticateJWT,
    authorizeBlogOwner, 
    blogController.deleteArticle
)


module.exports = articleRouter