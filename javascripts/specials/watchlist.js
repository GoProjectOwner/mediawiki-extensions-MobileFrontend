( function( $ ) {

	// FIXME: Kill the need for this horrible function by giving me a nicer API
	function getPagesFromQueryResult( result ) {
		var key, pages = {}, allPages = result.query.pages;
		for ( key in allPages ) {
			if ( allPages.hasOwnProperty( key ) ) {
				pages[ allPages[ key ].title ] = allPages[ key ];
			}
		}
		return pages;
	}

	function init( M ) {
		var titles = [], $items = $( '#mw-mf-watchlist li .mw-mf-title' );

		$items.each( function() {
			if ( titles.length < 50 ) { // FIXME: limit to first 50 for time being
				titles.push( $( this ).text() );
			}
		} );

		$.ajax( {
			url: M.getApiUrl(),
			dataType: 'json',
			data: {
				action: 'query',
				format: 'json',
				prop: 'pageimages',
				pithumbsize: 120, // ask for slightly bigger to increase likelihood of covering 100px by 100px space
				titles: titles.join( '|' )
			}
		} ).done( function( r ) {
			var pages = getPagesFromQueryResult( r );

			$items.each( function() {
				var $el = $( this ), page = pages[ $el.text() ];
				if ( page && page.thumbnail ) {
					$( '<div class="listThumb">' ).css( {
						'background-image': 'url(' + page.thumbnail.source + ')'
					} ).prependTo( $el.parents( 'li' ) );
				}
			} );
		} );
	}

	$( document ).ready( function() {
		init( mw.mobileFrontend );
	} );

} )( jQuery );
