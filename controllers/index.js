/**
 * Index page of the pencilblue theme
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Index(){}

//dependencies
var TopMenu        = require('../include/theme/top_menu');
var Media          = require('../include/theme/media');
var Comments       = require('../include/theme/comments');
var ArticleService = require('../include/service/entities/article_service').ArticleService;

//inheritance
util.inherits(Index, pb.BaseController);

Index.prototype.render = function(cb) {
	var self = this;
	
	this.ts.load('index', function(err, data) {
        var result = data;
                        
        TopMenu.getTopMenu(self.session, self.localizationService, function(themeSettings, navigation, accountButtons) {
            TopMenu.getBootstrapNav(navigation, accountButtons, function(navigation, accountButtons) {
                result = result.split('^navigation^').join(navigation);
                result = result.split('^account_buttons^').join(accountButtons);
                
                //create callback to be issued by all the find calls
                var articleCallback = function(err, articles) {
                	self.processArticles(result, articles, themeSettings, cb);
                };

                //determine and execute the proper call
                var section = self.req.pencilblue_section || null;
                var topic   = self.req.pencilblue_topic   || null;
                var article = self.req.pencilblue_article || null;
                var page    = self.req.pencilblue_page    || null;
                
                var service = new ArticleService();
                if(section) {pb.log.debug('section=%s to=%s', util.inspect(section), typeof section);
                    service.findBySection(section, articleCallback);
                }
                else if(topic) {
                    service.findByTopic(topic, articleCallback);
                }
                else if(article) {
                    service.findById(article, articleCallback);
                }
                else if(page) {
                    service.setContentType('page');
                    service.findById(page, articleCallback);
                }
                else{
                	service.find({}, articleCallback);
                }
            });
        });
    });
};

Index.prototype.processArticles = function(result, articles, themeSettings, cb) {
	var self = this;
	
	Media.getCarousel(themeSettings.carousel_media, result, '^carousel^', 'index_carousel', function(newResult) {
		
        pb.content.getSettings(function(err, contentSettings) {
        	
        	ArticleService.getMetaInfo(articles[0], function(metaKeywords, metaDescription, metaTitle) {
                
                result = result.split('^meta_keywords^').join(metaKeywords);
                result = result.split('^meta_desc^').join(metaDescription);
                result = result.split('^meta_title^').join(metaTitle);
                result = result.split('^meta_lang^').join(localizationLanguage);
                result = result.split('^current_url^').join(self.req.url);
                
                Comments.getCommentsTemplate(contentSettings, function(commentsTemplate) {
                    result = result.split('^comments^').join(commentsTemplate);
                    
                    var loggedIn       = false;
                    var commentingUser = {};
                    if(self.session.authentication.user) {
                        loggedIn       = true;
                        commentingUser = Comments.getCommentingUser(self.session.authentication.user);
                    }
            
                    var objects = {
                        contentSettings: contentSettings,
                        loggedIn: loggedIn,
                        commentingUser: commentingUser,
                        themeSettings: themeSettings,
                        articles: articles,
                        trustHTML: 'function(string){return $sce.trustAsHtml(string);}'
                    };
                    var angularData = pb.js.getAngularController(objects, ['ngSanitize']);
                    result = result.concat(angularData);
                
                    var content = self.localizationService.localize(['pencilblue_generic', 'timestamp'], result);
                    cb({content: content});
                });
            });
        });
    });
};

Index.prototype.getPageName = function() {
	return pb.config.siteName;
};

//exports
module.exports = Index;
