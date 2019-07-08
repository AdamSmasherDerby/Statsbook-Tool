// probably should just install downloadjs, but this will do for this PR

function download(data, filename) {
    const url = URL.createObjectURL( data )
    const link = document.createElement( 'a' )
    link.setAttribute( 'href', url )
    link.setAttribute( 'download', filename)

    const e = document.createEvent( 'MouseEvents' )
    e.initMouseEvent( 'click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null)
    link.dispatchEvent( e )
}

module.exports = download;