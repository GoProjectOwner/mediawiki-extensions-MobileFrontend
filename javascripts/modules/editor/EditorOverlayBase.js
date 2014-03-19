( function( M, $ ) {
	var OverlayNew = M.require( 'OverlayNew' ),
		Page = M.require( 'Page' ),
		inKeepGoingCampaign = M.query.campaign === 'mobile-keepgoing',
		user = M.require( 'user' ),
		toast = M.require( 'toast' ),
		EditorOverlayBase;

	EditorOverlayBase = OverlayNew.extend( {
		defaults: {
			continueMsg: mw.msg( 'mobile-frontend-editor-continue' ),
			saveMsg: mw.msg( 'mobile-frontend-editor-save' ),
			cancelMsg: mw.msg( 'mobile-frontend-editor-cancel' ),
			keepEditingMsg: mw.msg( 'mobile-frontend-editor-keep-editing' ),
			summaryMsg: mw.msg( 'mobile-frontend-editor-summary-placeholder' ),
			licenseMsg: mw.msg( 'mobile-frontend-editor-license' ),
			placeholder: mw.msg( 'mobile-frontend-editor-placeholder' ),
			waitMsg: mw.msg( 'mobile-frontend-editor-wait' ),
			captchaMsg: mw.msg( 'mobile-frontend-account-create-captcha-placeholder' ),
			captchaTryAgainMsg: mw.msg( 'mobile-frontend-editor-captcha-try-again' ),
		},
		template: M.template.get( 'modules/editor/EditorOverlayBase' ),
		className: 'overlay editor-overlay',

		_updateEditCount: function() {
			this.editCount += 1;
			mw.config.set( 'wgUserEditCount', this.editCount );
		},
		_shouldShowKeepGoingOverlay: function() {
			if ( M.isBetaGroupMember() &&
				mw.config.get( 'wgMFKeepGoing' ) &&
				( this.editCount === 0 || inKeepGoingCampaign )
			) {
				return true;
			} else {
				return false;
			}
		},
		/**
		 * If this is a new article, require confirmation before saving.
		 */
		confirmSave: function() {
			if ( this.isNewPage &&
				!window.confirm( mw.msg( 'mobile-frontend-editor-new-page-confirm', mw.user ) )
			) {
				return false;
			} else {
				return true;
			}
		},
		/**
		 * Executed when page save is complete. Handles reloading the page, showing toast
		 * messages, and setting mobile edit cookie.
		 */
		onSave: function() {
			var title = this.options.title,
				extraToastClasses = '', msg;

			// FIXME: use generic method for following 3 lines
			M.pageApi.invalidatePage( title );
			new Page( { title: title, el: $( '#content_wrapper' ) } ).on( 'ready', M.reloadPage );
			M.router.navigate( '' );

			if ( this.isNewPage ) {
				msg = 'mobile-frontend-editor-success-new-page';
			} else if ( this.isNewEditor ) {
				extraToastClasses = 'landmark';
				msg = 'mobile-frontend-editor-success-landmark-1';
			} else {
				msg = 'mobile-frontend-editor-success';
			}

			if ( this._shouldShowKeepGoingOverlay() ) {
				// Show KeepGoing overlay at step 1 (ask)
				mw.loader.using( 'mobile.keepgoing', function() {
					var KeepGoingOverlay = M.require( 'modules/keepgoing/KeepGoingOverlay' );
					new KeepGoingOverlay( { step: 1, isNewEditor: true } ).show();
				} );
			} else {
				// just show a toast
				toast.show( mw.msg( msg ), extraToastClasses );
			}

			// Set a cookie for 30 days indicating that this user has edited from
			// the mobile interface.
			$.cookie( 'mobileEditor', 'true', { expires: 30 } );
			this._updateEditCount();
		},
		initialize: function( options ) {
			if ( this.readOnly ) {
				options.readOnly = true;
				options.editingMsg = mw.msg( 'mobile-frontend-editor-viewing-source-page', options.title );
			} else {
				options.editingMsg = mw.msg( 'mobile-frontend-editor-editing-page', options.title );
			}
			if ( !options.previewingMsg ) {
				options.previewingMsg = mw.msg( 'mobile-frontend-editor-previewing-page', options.title );
			}
			if ( options.isNewPage ) {
				options.placeholder =  mw.msg( 'mobile-frontend-editor-placeholder-new-page', mw.user );
			}
			this.editCount = user.getEditCount();
			this.isNewPage = options.isNewPage;
			this.isNewEditor = options.isNewEditor;

			// pre-fetch keep going with expectation user will go on to save
			if ( this._shouldShowKeepGoingOverlay() ) {
				mw.loader.using( 'mobile.keepgoing' );
			}

			this._super( options );
		},
		postRender: function( options ) {
			this._super( options );
			this._showHidden( '.initial-header' );
		},
		hide: function( force ) {
			var confirmMessage = mw.msg( 'mobile-frontend-editor-cancel-confirm' );
			if ( force || !this._hasChanged() || window.confirm( confirmMessage ) ) {
				return this._super();
			} else {
				return false;
			}
		},
		_showCaptcha: function( url ) {
			var self = this, $input = this.$( '.captcha-word' );

			if ( this.captchaShown ) {
				$input.val( '' );
				$input.attr( 'placeholder', this.options.captchaTryAgainMsg );
				setTimeout( function() {
					$input.attr( 'placeholder', self.options.captchaMsg );
				}, 2000 );
			}

			this.$( '.captcha-panel img' ).attr( 'src', url );
			this._showHidden( '.save-header, .captcha-panel' );

			this.captchaShown = true;
		}
	} );

	M.define( 'modules/editor/EditorOverlayBase', EditorOverlayBase );
}( mw.mobileFrontend, jQuery ) );
