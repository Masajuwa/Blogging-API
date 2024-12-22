const mongoose = require("mongoose");
const articleModel = require("../models/blog")
const userModel = require("../models/user")

async function getAllPublishedArticles (req, res) {
    try {
        const { page = 1, sort = 'timestamp', order = 'desc', search = '' } = req.query;
        const limit = 20; // Number of articles per page
        const skip = (page - 1) * limit;

    
        const searchQuery = { state: 'published' };

        if (search) {
            const regex = new RegExp(search, 'i'); // Case-insensitive regex for partial matches

            // Search by title, tags, or author name
            const users = await userModel.find({
                $or: [
                    { first_name: regex },
                    { last_name: regex },
                    { $expr: { $regexMatch: { input: { $concat: ['$first_name', ' ', '$last_name'] }, regex } } },
                ],
            });

            const authorIds = users.map((user) => user._id);

            searchQuery.$or = [
                { title: regex },
                { tags: { $in: [regex] } },
                { author: { $in: authorIds } },
            ];
        }

        // Sort mapping
        const sortOptions = {
            read_count: 'read_count',
            reading_time: 'reading_time',
            timestamp: 'createdAt',
        };
 
        const sortField = sortOptions[sort] || 'createdAt'; // Default to timestamp
        const sortOrder = order === 'asc' ? 1 : -1;

        // Query for blogs
        const blogs = await articleModel.find(searchQuery)
            .populate('author', 'first_name last_name email')
            .skip(skip)
            .limit(limit)
            .sort({ [sortField]: sortOrder });

        const totalNoOfArticles = await articleModel.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalNoOfArticles / limit);

        res.render('publishedArticles', {
            blogs,             
            page: Number(page), // Current page number
            totalPages,        
            totalNoOfArticles,  // Total count of articles
            sort,               
            order,             
            search,            
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }

}

async function getBlogById (req, res) {
    try {
        const articleId = req.params.id

        if (!mongoose.Types.ObjectId.isValid(articleId)) {
            return res.status(400).json({ message: 'Invalid article ID' });
          }

        const blog = await articleModel.findByIdAndUpdate(articleId,
            { $inc: { read_count: 1 } }, // Increment read_count by 1
            { new: true, useFindAndModify: false } 
        ).populate('author', 'first_name last_name email');
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found.' });
        }

        res.render('blog', { blog });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

async function getListofArticlesForAnAuthor (req, res) {
    try {

        const user = await userModel.findById(req.user.id).select('first_name last_name email id'); 
        if (!user) {
            return res.status(404).json({ message: 'User not found, try logging in' });
        }
         // Query parameters for state and page
        const { state } = req.query;
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = 10; // Articles per page
        const skip = (page - 1) * limit;

        const filter = { author: user.id};
        if (state) {
            filter.state = state;
        }
            const totalArticles = await articleModel.countDocuments(filter);

            // Fetch articles based on filter, pagination, and sorting
            const authorArticles = await articleModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

            const totalPages = Math.ceil(totalArticles / limit);

            res.render('my-articles', {
                articles: authorArticles,
                user: user,
                state: state || 'all',
                currentPage: page,
                totalPages,
            });
            console.log("Fetched Articles:", authorArticles);  // Log the fetched articles
    } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Internal server error' });        
    }
}

async function createArticle(req, res) {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized. User not found.' });
    }

    try {
        const { title, description, body, tags, state } = req.body;

        if (!title || !description || !body) {
            return res.status(400).json({ message: 'Title, description, and body are required.' });
        }

        const existingArticle = await articleModel.findOne({ title });
        if (existingArticle) {
            return res.status(400).json({ message: 'Title already exists. Please use a different title.' });
        }


        const newArticle = await articleModel.create({
            title,
            description,
            body,
            tags,
            state,
            author: req.user.id
        });

        const populatedArticle = await articleModel
            .findById(newArticle._id)
            .populate('author', 'first_name last_name email'); // Populate author details

        console.log(newArticle)
        res.status(201).json({ message : "Article created Successfully"})
    } catch (err) {
        console.error(err)
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation error', details: err.errors });
        }
        res.status(500).json({ message: 'Server error' });
    }
}


async function updateArticle (req, res) {
    try {

        const { id } = req.params;
        const updates = req.body;
        const updatedArticle = await articleModel.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedArticle) {
            return res.status(404).json({ message: 'Article not found.' });
        }

        res.render('singleBlog', {
            blog: updatedArticle,
            message: 'Article updated successfully'
        }); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

async function deleteArticle (req, res) {
    try {
        const deletedArticle =  await articleModel.findByIdAndDelete(req.params.id);

        // If the blog was not found and deleted
        if (!deletedArticle) {
            return res.status(404).json({ message: 'Article not found' });
        }

        // Respond with a success message
        res.status(200).json({ message: 'Article deleted successfully' });
    } catch (err) {
        console.error(err);  // Log the error for debugging
        res.status(500).json({ message: 'Server error' });
    }
}

async function editContent(req, res) {
    const blog = await articleModel.findById(req.params.id);

    if (!blog) {
        return res.status(404).json({ message: 'Blog not found.' });
    }

    res.render('updateArticle', { user : req.user, blog});
}

async function getLoggedOnUserWelcomePage (req, res ) {
       // Check if req.user exists and has an ID
       if (!req.user || !req.user.id) {
        return res.status(400).json({ message: 'User not authenticated' });
    }

    const user = await userModel.findById(req.user.id).select('first_name last_name email'); 
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Render the page with user details
    res.render('blogger', {
        user,
        message: "Login Successful",
    });
    console.log("Decoded user:", req.user);
    res.render('blogger', { user: req.user, message: "Login Successful"})
}

module.exports = {
    getAllPublishedArticles,
    createArticle,
    updateArticle,
    deleteArticle,
    getBlogById,
    getListofArticlesForAnAuthor,
    editContent,
    getLoggedOnUserWelcomePage
}