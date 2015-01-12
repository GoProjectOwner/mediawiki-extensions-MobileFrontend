( function ( M, $ ) {
	var WikiGrokDialog = M.require( 'modules/wikigrok/WikiGrokDialog' ),
		wikiGrokCampaigns = M.require( 'modules/wikigrok/wikiGrokCampaigns' ),
		WikiGrokDialogB;

	/**
	 * @class WikiGrokDialogB
	 * @extends WikiGrokDialog
	 * THIS IS AN EXPERIMENTAL FEATURE THAT MAY BE MOVED TO A SEPARATE EXTENSION.
	 * This creates the dialog at the bottom of the lead section that appears when a user
	 * scrolls past the lead. It asks the user to confirm metadata information for use
	 * in Wikidata (https://www.wikidata.org).
	 */
	WikiGrokDialogB = WikiGrokDialog.extend( {
		version: 'b',
		template: mw.template.get( 'mobile.wikigrok.dialog.b', 'Dialog.hogan' ),
		defaults: $.extend( WikiGrokDialog.prototype.defaults, {
			thanksMsg: 'You just made Wikipedia a little better, thanks!'
		} ),
		/** @inheritdoc */
		initialize: function () {
			var self = this;

			WikiGrokDialog.prototype.initialize.apply( this, arguments );

			// log page impression and widget impression when the widget is shown
			this.once( 'show', function () {
				self.logPageImpression();
				self.initializeWidgetImpressionLogging();

			} );
		},
		/**
		 * Renders a set of buttons to the panel.
		 * Fetches suggestions' labels from the server.
		 * Shows panel to user when there are suggestions.
		 * @method
		 * @private
		 */
		_renderSuggestions: function () {
			var suggestions,
				allSuggestions,
				$next,
				$none,
				self = this;

			allSuggestions = wikiGrokCampaigns.getAllSuggestions();
			// randomly pick 4 suggestions
			suggestions = self.chooseRandomItemsFromArray( allSuggestions, 4 );

			// Now work out the labels if we have some suggestions
			if ( suggestions.length ) {
				$next = self.$( '.footer .next' );
				$none = self.$( '.footer .none' );

				// Hard-code the "Next" button width to match the "None" button width.
				// That way, when the buttons are switched, the width stays the same.
				// This depends on the assumption that the "Next" button text is
				// always shorter than the "None" button text.
				$next.css( 'width', $none.outerWidth() );

				self.$( '.tags' ).show();
				$.each( suggestions, function ( i, suggestion ) {
					var $tag, tagHtml, templateData;

					templateData = {
						id: 'tag-' + suggestion.id,
						propName: suggestion.campaign.propertyName,
						propId: suggestion.campaign.propertyId,
						itemId: suggestion.id,
						readable: suggestion.label,
						// replace 'instance of' with 'type'
						campaignText: ( suggestion.campaign.propertyName === 'instance of' ) ?
							'type' : suggestion.campaign.propertyName,
						tagText: suggestion.label
					};

					if ( suggestion.label ) {
						tagHtml = mw.template.get( 'mobile.wikigrok.dialog.b', 'tagButton.hogan' )
							.render( templateData );

						$tag = $( tagHtml )
							.on( 'click', function () {
								// Activate the tag
								$( this ).toggleClass( 'mw-ui-progressive' );
								// If there are any tags active, switch submit button from
								// "None" to "Next".
								if ( self.$( '.tags .ui-tag-button.mw-ui-progressive' ).length ) {
									$none.hide();
									$next.show();
								} else {
									$next.hide();
									$none.show();
								}
							} ).appendTo( self.$( '.tags' ) );
					}
				} );

				// only show the panel when we have created at least one button
				if ( self.$( '.ui-tag-button' ).length ) {
					self.$( '.spinner' ).hide();
					self.show();
				}
			}
		},
		/**
		 * Thank the user for their contribution. Also log this event.
		 * @method
		 */
		postRecordClaims: function () {
			var self = this;

			self.$( '.wg-content, .tags, .footer, .spinner' ).hide();
			self.$( '.wg-thanks-content' ).removeClass( 'hidden' );
			self.$( '.wg-link' ).show();
			self.log( 'widget-impression-success' );
		},
		/**
		 * Show suggestions to the user.
		 * Also record claims when the user hits the save button.
		 * FIXME: Please refactor
		 * @method
		 * @param {Object} options needed to render
		 */
		askWikidataQuestion: function ( options ) {
			var self = this;

			self.$( '.wg-notice' ).hide();
			self.$( '.wg-buttons' ).hide();
			self.$( '.spinner' ).show();
			self.$( '.wg-content' ).text( 'Select tags that correctly describe ' + options.title );
			self.$( '.footer' ).show();

			self._renderSuggestions( options.campaign );

			this.$save = this.$( '.save' );
			this.$save.on( 'click', function () {
				var answers = [];
				self.$( '.tags .ui-tag-button' ).each( function () {
					var $this = $( this );
					answers.push( {
						correct: $this.is( '.mw-ui-progressive' ) ? true : null,
						prop: $this.data( 'propname' ),
						propid: $this.data( 'propid' ),
						value: $this.data( 'readable' ),
						valueid: $this.data( 'itemid' )
					} );
				} );

				self.$( '.tags' ).hide();
				self.$( '.spinner' ).show();
				self.apiWikiGrokResponse.recordClaims( answers ).always( function () {
					self.postRecordClaims();
				} ).fail( function () {
					self.handleError( 'no-response-cannot-record-user-input' );
				} );
				self.log( 'widget-click-submit' );
				self.rememberWikiGrokContribution();
			} );

			// hide this Dialog when the user reads more about Wikigrok
			this.$( '.tell-more' ).on( 'click', function () {
				self.hide();
				self.log( 'widget-click-moreinfo' );
			} );
		},
		/**
		 * @inheritdoc
		 */
		postRender: function ( options ) {
			var self = this;

			self.$( '.tags, .wg-link, .footer, .spinner' ).hide();

			// show the welcome screen once
			if ( !options.beginQuestions ) {
				options.beginQuestions = true;
				this.$( '.wg-buttons .cancel' ).on( 'click', function () {
					self.hide();
					self.log( 'widget-click-nothanks' );
				} );
				this.$( '.wg-buttons .proceed' ).on( 'click', function () {
					self.log( 'widget-click-accept' );
					// Proceed with asking the user a metadata question.
					self.askWikidataQuestion( options );
				} );
				// Log more info clicks
				this.$( '.wg-notice-link' ).on( 'click', function () {
					self.log( 'widget-click-moreinfo' );
				} );

				// hide wikigrok after an error has occurred
				this.$( '.pane.error .close' ).on( 'click', function () {
					self.hide();
				} );

				this.reveal( options );
			}
		},

		/**
		 * @inheritdoc
		 */
		reveal: function ( options ) {
			if ( options.campaign ) {
				this.show();
			}
		}
	} );

	M.define( 'modules/wikigrok/WikiGrokDialogB', WikiGrokDialogB );
}( mw.mobileFrontend, jQuery ) );
