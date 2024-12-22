const articleModel = require("../models/blog")

const authorizeBlogOwner = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: Please log in to access this resource' });
        }

        // Find the article by its ID
        const article = await articleModel.findById(req.params.id);

        // If the article doesn't exist, return a 404 error
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        if (article.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized: You are not the owner of this article' });
        }

        req.article = article;

        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = authorizeBlogOwner
