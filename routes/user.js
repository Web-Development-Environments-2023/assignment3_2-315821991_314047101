var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});

/**
 * This path returns personal recipe's expanded data: preview & servings amount, cooking instructions, ingredients list & amounts 
 */
 router.get("/personal_recipe_expande_data", async (req, res, next) => {
  // send parameters by : http://localhost:3000/recipes/personal_recipe_expande_data?recipeID=2 for example
  try {
    try{
      let user_id = req.session.user_id;
      let recipe_id = req.query.recipeID;
      const recipe = await user_utils.getRecipeExpandedData(user_id, recipe_id);
      res.send(recipe);
    }
    catch (error) {
      res.send({ failure: true, message: "you should first log in the site" });
     }    
  } catch (error) {
    next(error);
  }
});


/**
 * This path gets body with new recipe details, and saves it in the personal recipes DB
 */
 router.post('/add_personal_recipe', async (req,res,next) => {
  try{
    const response = await user_utils.addPersonalRecipe(req.session.user_id,req.body.title, req.body.readyInMinutes, req.body.image, req.body.popularity, req.body.vegan, req.body.vegetarian, req.body.glutenFree, req.body.servings, req.body.Instructions, req.body.IngredientsList);
    res.status(200).send(response);
    } catch(error){
    next(error);
  }
})

/**
 * This path returns the user's family recipes
 */
 router.get('/family_recipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const response = await user_utils.getFamilyRecipes(user_id);
    res.status(200).send(response);
  } catch(error){
    next(error); 
  }
});

/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id,recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let favorite_recipes = {};
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

module.exports = router;
