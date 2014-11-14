define([
    'underscore',
    'jquery',
    'post_image',
    'text!' + Upfront.themeExporter.root + 'templates/tpl/post_design.html'
    //'underscore', 'jquery', 'text!templates/image_variants.html'
], function(_, $, post_image, post_design_tpl) {

    var PostDesignButton = Backbone.View.extend({
        tpl: _.template($(post_design_tpl).find('#save-post-design').html()),
        className: "uf-exporter-save-post-design",
        initialize: function( options ) {

        },
        events: {
            "click" : "on_click"
        },
        render: function(){
            this.$el.html( this.tpl() );
            return this;
        },
        on_click: function( e ){
            e.preventDefault();
            Upfront.Events.trigger('post:layout:post:style:cancel');
            postLayoutManager.exportPostLayout();
        }
    });

    var PostLayoutManager = function(){
        this.init();
    };

    PostLayoutManager.prototype = {
        init: function(){
            var me = this;
            if(!Upfront.Events.on){
                return setTimeout(function(){
                    me.init();
                },50);
            }

            Upfront.Events.on('post:layout:sidebarcommands', _.bind(this.addExportCommand, this));
            //Upfront.Events.on('command:layout:export_postlayout', _.bind(this.exportPostLayout, this));
            Upfront.Events.on('post:layout:partrendered',_.bind(this.setTestContent, this) );
            Upfront.Events.on('post:layout:post:style:cancel', _.bind(this.cancelPostContentStyle, this));
            Upfront.Events.on('post:parttemplates:edit', _.bind(this.addTemplateExportButton, this));
        },

        addExportCommand: function(){
            if( Upfront.Application.PostLayoutEditor.postView.editor.post.get("post_type") === "post" ) return;
            var commands = Upfront.Application.sidebar.sidebar_commands.control.commands,
                wrapped = commands._wrapped,
                Command = Upfront.Views.Editor.Command.extend({
                    className: "command-export",
                    render: function (){
                        this.$el.text('Export');
                    },
                    on_click: this.exportPostLayout
                })
                ;

            if(wrapped[wrapped.length - 2].className != 'command-export')
                wrapped.splice(wrapped.length - 1, 0, new Command());

        },
        addTemplateExportButton: function(){
            var me = this,
                exportButton = $('<a href="#" class="upfront-export-postpart">Export</a>'),
                editorBody = $('#upfront_code-editor').find('.upfront-css-body')
                ;

            if(!editorBody.find('.upfront-export-postpart').length)
                editorBody.append(exportButton);
            exportButton.on('click', function(e){
                e.preventDefault();
                me.exportPartTemplate();
            });

            console.log('Export button');

        },
        exportPostLayout: function(){
            Upfront.Events.trigger("command:layout:export_postlayout");
            var self = this,
                editor = Upfront.Application.PostLayoutEditor,
                saveDialog = new Upfront.Views.Editor.SaveDialog({
                    question: 'Do you wish to export the post layout just for this post or apply it to all posts?',
                    thisPostButton: 'This post only',
                    allPostsButton: 'All posts of this type'
                });
                elementType = editor.postView.property('type'),
                specificity = editor.postView.property('post_type') ? editor.postView.property('post_type') : "post" ,
                post_type = editor.postView.editor.post.get('post_type'),
                elementSlug = elementType == 'ThisPostModel' ? 'single' : 'archive',
                loading = new Upfront.Views.Editor.Loading({
                    loading: "Saving post layout...",
                    done: "Thank you for waiting",
                    fixed: false
                })
                ;

            var layoutData = {
                postLayout: editor.exportPostLayout(),
                partOptions: editor.postView.partOptions || {}
            };

            loading.render();
            $('body').append(loading.$el);
            Upfront.Util.post({
                action: 'upfront_thx-export-post-layout',
                layoutData: layoutData,
                params: {
                    specificity : post_type,
                    type        : elementSlug
                }
            }).done(function (response) {
                loading.done();
                var message = "<h4>Layout successfully exported in the following file:</h4>";
                message += response.file;
                Upfront.Views.Editor.notify( message );
                //saveDialog.close();
                editor.postView.postLayout = layoutData.postLayout;
                editor.postView.render();
                Upfront.Application.start(Upfront.Application.mode.last);

            });
        },
        exportPartTemplate: function(){
            console.log('Export!');

            var self = this,
                editor = Upfront.Application.PostLayoutEditor.templateEditor,
                saveDialog = new Upfront.Views.Editor.SaveDialog({
                    question: 'Do you wish to export the template just for this post or all the post of this type?',
                    thisPostButton: 'This post only',
                    allPostsButton: 'All posts of this type'
                })
                ;

            saveDialog.render();
            saveDialog.on('closed', function(){
                saveDialog.remove();
                saveDialog = false;
            });

            saveDialog.on('save', function(type) {
                var me = this,
                    tpl = editor.ace.getValue(),
                    postView = Upfront.Application.PostLayoutEditor.postView,
                    postPart = editor.postPart,
                    element = postView.property('type'),
                    id
                    ;

                if(type == 'this-post'){
                    if(element == 'UpostsModel')
                        id = postView.property('element_id').replace('uposts-object-', '');
                    else
                        id = postView.editor.postId;
                }
                else
                    id = postView.editor.post.get('post_type');

                Upfront.Util.post({
                    action: 'upfront_thx-export-part-template',
                    part: postPart,
                    tpl: tpl,
                    type: element,
                    id: id
                })
                    .done(function(response){
                        postView.partTemplates[editor.postPart] = tpl;
                        postView.model.trigger('template:' + editor.postPart);
                        editor.close();
                        saveDialog.close();
                        Upfront.Views.Editor.notify("Part template exported in file " + response.filename);
                    })
                ;

            });
        },

        setTestContent: function(view){
            var self = this;
            if(view.postPart != 'contents')
                return;

            if( Upfront.Application.PostLayoutEditor.postView.editor.post.get("post_type") === "post" ){
                this._setPostTestContent(view);
            }else{
                this._setTestContent(view);
            }

        },
        _setTestContent: function( view ){
            view.$('.upfront-object-content .post_content').html(Upfront.data.exporter.testContent);
        },
        _setPostTestContent: function( view ){
            var self = this;
            if( view ) this.view = view;
            this.view.$('.upfront-object-content .post_content').html(Upfront.data.exporter.postTestContent);
            this.savePostDesingButton = new PostDesignButton();
            this.savePostDesingButton.render();
           setTimeout(function(){
                $(".upfront-region-container-postlayouteditor").append( self.savePostDesingButton.$el );
            }, 50);

            /**
             * Start content styler on click
             */
            this.view.$(".upfront_edit_content_style").on("click", function(e){
                self.view.$('.upfront-object-content .post_content').html(Upfront.data.exporter.styledTestContent);
                self.view.$('.upfront-object').addClass("upfront-editing-content-style");
                self.view.$('.upfront-object-content').closest(".upfront-object-view").addClass("upfront-disable-surroundings");
                new post_image.PostImageVariants({
                    contentView : self.view
                });
                Upfront.Application.MODE.POSTCONTENT_STYLE = true;
            });
        },
        cancelPostContentStyle: function(){
            this.savePostDesingButton.remove();
            $('.upfront-output-PostPart_contents').closest(".upfront-object-view").removeClass("upfront-disable-surroundings");
            //$('.upfront-output-PostPart_contents .post_content').html(Upfront.data.exporter.postTestContent);
            this._setPostTestContent();
            Upfront.Application.MODE.POSTCONTENT_STYLE = false;
        }
    };

    var postLayoutManager = new PostLayoutManager();
    return postLayoutManager;

});