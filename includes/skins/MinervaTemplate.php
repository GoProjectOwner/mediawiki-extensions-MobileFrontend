<?php
/**
 * MinervaTemplate.php
 */

/**
 * Extended Template class of BaseTemplate for mobile devices
 */
class MinervaTemplate extends BaseTemplate {
	/** @var boolean Temporary variable that decides whether
	 * history link should be rendered before the content. */
	protected $renderHistoryLinkBeforeContent = true;
	/** @var string $searchPlaceHolderMsg Message used as placeholder in search input */
	protected $searchPlaceHolderMsg = 'mobile-frontend-placeholder';

	/** @var boolean Specify whether the page is a special page */
	protected $isSpecialPage;

	/** @var boolean Whether or not the user is on the Special:MobileMenu page */
	protected $isSpecialMobileMenuPage;

	/** @var boolean Specify whether the page is main page */
	protected $isMainPage;

	/**
	 * Gets the header content for the top chrome.
	 * @param array $data Data used to build the page
	 * @return string
	 */
	protected function getChromeHeaderContentHtml( $data ) {
		return $this->getSearchForm( $data );
	}

	/**
	 * Generates the HTML required to render the search form.
	 *
	 * @param array $data The data used to render the page
	 * @return string
	 */
	protected function getSearchForm( $data ) {
		return Html::openElement( 'form',
				array(
					'action' => $data['wgScript'],
					'class' => 'search-box',
				)
			) .
			$this->makeSearchInput( $this->getSearchAttributes() ) .
			$this->makeSearchButton(
				'fulltext',
				array(
					'class' => MobileUI::buttonClass( 'progressive', 'fulltext-search no-js-only' ),
				)
			) .
			Html::closeElement( 'form' );
	}

	/**
	 * Start render the page in template
	 */
	public function execute() {
		$title = $this->getSkin()->getTitle();
		$this->isSpecialPage = $title->isSpecialPage();
		$this->isSpecialMobileMenuPage = $this->isSpecialPage &&
			$title->equals( SpecialPage::getTitleFor( 'MobileMenu' ) );
		$this->isMainPage = $title->isMainPage();
		Hooks::run( 'MinervaPreRender', array( $this ) );
		$this->render( $this->data );
	}

	/**
	 * Returns the available languages for this page
	 * @return array
	 */
	public function getLanguageVariants() {
		return $this->data['content_navigation']['variants'];
	}

	/**
	 * Get the language links for this page
	 * @return array
	 */
	public function getLanguages() {
		return $this->data['language_urls'];
	}

	/**
	 * Returns available page actions
	 * @return array
	 */
	public function getPageActions() {
		return $this->data['page_actions'];
	}

	/**
	 * Returns footer links
	 * @param string $option
	 * @return array
	 */
	public function getFooterLinks( $option = null ) {
		return $this->data['footerlinks'];
	}

	/**
	 * Get attributes to create search input
	 * @return array Array with attributes for search bar
	 */
	protected function getSearchAttributes() {
		$searchBox = array(
			'id' => 'searchInput',
			'class' => 'search',
			'autocomplete' => 'off',
			// The placeholder gets fed to HTML::element later which escapes all
			// attribute values, so no need to escape the string here.
			'placeholder' =>  wfMessage( $this->searchPlaceHolderMsg )->text(),
		);
		return $searchBox;
	}

	/**
	 * Render Footer elements
	 * @param array $data Data used to build the footer
	 */
	protected function renderFooter( $data ) {
		?>
		<div id="footer">
			<?php
				foreach ( $this->getFooterLinks() as $category => $links ) {
			?>
				<ul class="footer-<?php echo $category; ?>">
					<?php
						foreach ( $links as $link ) {
							if ( isset( $this->data[$link] ) && $this->data[$link] !== '' ) {
								echo Html::openElement( 'li', array( 'id' => "footer-{$category}-{$link}" ) );
								$this->html( $link );
								echo Html::closeElement( 'li' );
							}
						}
					?>
				</ul>
			<?php
				}
			?>
		</div>
		<?php
	}

	/**
	 * Render available page actions
	 * @param array $data Data used to build page actions
	 */
	protected function renderPageActions( $data ) {
		$actions = $this->getPageActions();
		if ( $actions ) {
			?><ul id="page-actions" class="hlist"><?php
			foreach ( $actions as $key => $val ) {
				echo $this->makeListItem( $key, $val );
			}
			?></ul><?php
		}
	}

	/**
	 * Returns the 'Last edited' message, e.g. 'Last edited on...'
	 * @param array $data Data used to build the page
	 * @return string
	 */
	protected function getHistoryLinkHtml( $data ) {
		$action = Action::getActionName( RequestContext::getMain() );
		if ( isset( $data['historyLink'] ) && $action === 'view' ) {
			$historyLink = $data['historyLink'];
			$args = array(
				'isMainPage' => $this->getSkin()->getTitle()->isMainPage(),
				'link' => $historyLink['href'],
				'text' => $historyLink['text'],
				'username' => $historyLink['data-user-name'],
				'userGender' => $historyLink['data-user-gender'],
				'timestamp' => $historyLink['data-timestamp']
			);
			$templateParser = new TemplateParser( __DIR__ );
			return $templateParser->processTemplate( 'history', $args );
		} else {
			return '';
		}
	}

	/**
	 * Gets history link at top of page if it isn't the main page
	 * @param array $data Data used to build the page
	 * @return string
	 */
	protected function getHistoryLinkTopHtml( $data ) {
		if ( !$this->isMainPage ) {
			return $this->getHistoryLinkHtml( $data );
		} else {
			return '';
		}
	}

	/**
	 * Gets history link at bottom of page if it is the main page
	 * @param array $data Data used to build the page
	 * @return string
	 */
	protected function getHistoryLinkBottomHtml( $data ) {
		if ( $this->isMainPage ) {
			return $this->getHistoryLinkHtml( $data );
		} else {
			return '';
		}
	}

	/**
	 * Get page secondary actions
	 */
	protected function getSecondaryActions() {
		$result = $this->data['secondary_actions'];

		// If languages are available, add a languages link
		if ( $this->getLanguages() || $this->getLanguageVariants() ) {
			$languageUrl = SpecialPage::getTitleFor(
				'MobileLanguages',
				$this->getSkin()->getTitle()
			)->getLocalURL();

			$result['language'] = array(
				'attributes' => array(
					'class' => 'languageSelector',
					'href' => $languageUrl,
				),
				'label' => wfMessage( 'mobile-frontend-language-article-heading' )->text()
			);
		}

		return $result;
	}

	/**
	 * Get HTML representing secondary page actions like language selector
	 * @return string
	 */
	protected function getSecondaryActionsHtml() {
		$baseClass = MobileUI::buttonClass( '', 'button' );
		$html = Html::openElement( 'div', array( 'id' => 'page-secondary-actions' ) );

		foreach ( $this->getSecondaryActions() as $el ) {
			if ( isset( $el['attributes']['class'] ) ) {
				$el['attributes']['class'] .= ' ' . $baseClass;
			} else {
				$el['attributes']['class'] = $baseClass;
			}
			$html .= Html::element( 'a', $el['attributes'], $el['label'] );
		}

		return $html . Html::closeElement( 'div' );
	}

	/**
	 * Renders the content of a page
	 * @param array $data Data used to build the page
	 */
	protected function renderContent( $data ) {
		if ( !$data[ 'unstyledContent' ] ) {
			echo Html::openElement( 'div', array(
				'id' => 'content',
				'class' => 'content',
				'lang' => $data['pageLang'],
				'dir' => $data['pageDir'],
			) );
			?>
			<?php
				echo $data[ 'bodytext' ];
				if ( isset( $data['subject-page'] ) ) {
					echo $data['subject-page'];
				}
				echo $this->getPostContentHtml( $data );
				echo $this->getSecondaryActionsHtml();
				echo $this->getHistoryLinkBottomHtml( $data );
			?>
			</div>
			<?php
		} else {
			echo $data[ 'bodytext' ];
		}
	}

	/**
	 * Renders pre-content (e.g. heading)
	 * @param array $data Data used to build the page
	 */
	protected function renderPreContent( $data ) {
		$internalBanner = $data[ 'internalBanner' ];
		$isSpecialPage = $this->isSpecialPage;
		$preBodyText = isset( $data['prebodytext'] ) ? $data['prebodytext'] : '';

		if ( $internalBanner || $preBodyText ) {
		?>
		<div class="pre-content">
			<?php
				echo $preBodyText;
				// FIXME: Temporary solution until we have design
				if ( isset( $data['_old_revision_warning'] ) ) {
					echo $data['_old_revision_warning'];
				} elseif ( !$isSpecialPage ){
					$this->renderPageActions( $data );
				}
				echo $internalBanner;
				?>
		</div>
		<?php
		}
	}

	/**
	 * Gets HTML that needs to come after the main content and before the secondary actions.
	 *
	 * @param array $data The data used to build the page
	 * @return string
	 */
	protected function getPostContentHtml( $data ) {
		return '';
	}

	/**
	 * Render wrapper for loading content
	 * @param array $data Data used to build the page
	 */
	protected function renderContentWrapper( $data ) {
		if ( $this->renderHistoryLinkBeforeContent ) {
			echo $this->getHistoryLinkTopHtml( $data );
		?>
			<script>
				if ( window.mw && mw.mobileFrontend ) { mw.mobileFrontend.emit( 'history-link-loaded' ); }
			</script>
		<?php
		}
		?>
		<script>
			if ( window.mw && mw.mobileFrontend ) { mw.mobileFrontend.emit( 'header-loaded' ); }
		</script>
		<?php
			$this->renderPreContent( $data );
			$this->renderContent( $data );
			if ( !$this->renderHistoryLinkBeforeContent ) {
				echo $this->getHistoryLinkTopHtml( $data );
		?>
				<script>
					if ( window.mw && mw.mobileFrontend ) { mw.mobileFrontend.emit( 'history-link-loaded' ); }
				</script>
		<?php
			}
	}

	/**
	 * Gets the main menu only on Special:MobileMenu.
	 * On other pages the menu is rendered via JS.
	 * @param array [$data] Data used to build the page
	 * @return string
	 */
	protected function getMainMenuHtml( $data ) {
		if ( $this->isSpecialMobileMenuPage ) {
			$templateParser = new TemplateParser(
				__DIR__ . '/../../resources/mobile.mainMenu/' );

			return $templateParser->processTemplate( 'menu', $data['menu_data'] );
		} else {
			return '';
		}
	}

	/**
	 * Get HTML for header elements
	 * @param array $data Data used to build the header
	 * @return string
	 */
	protected function getHeaderHtml( $data ) {
		return $data['menuButton']
			. $this->getChromeHeaderContentHtml( $data )
			. $data['secondaryButton'];
	}

	/**
	 * Render the entire page
	 * @param array $data Data used to build the page
	 * @todo replace with template engines
	 */
	protected function render( $data ) {
		$templateParser = new TemplateParser( __DIR__ );

		// begin rendering
		echo $data[ 'headelement' ];
		?>
		<div id="mw-mf-viewport">
			<nav id="mw-mf-page-left" class="navigation-drawer">
				<?php echo $this->getMainMenuHtml( $data ); ?>
			</nav>
			<div id="mw-mf-page-center">
				<?php
					echo $templateParser->processTemplate( 'banners', $data );
				?>
				<div class="header">
					<?php
						echo $this->getHeaderHtml( $data );
					?>
				</div>
				<div id="content_wrapper">
				<?php
					$this->renderContentWrapper( $data );
				?>
				</div>
				<?php
					$this->renderFooter( $data );
				?>
			</div>
		</div>
		<?php
			echo $data['reporttime'];
			echo $data['bottomscripts'];
		?>
		</body>
		</html>
		<?php
	}
}
