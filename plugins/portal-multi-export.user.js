// ==UserScript==
// @id             iitc-plugin-portal-multi-export
// @name           IITC plugin: Portal Multi Export
// @category       Misc
// @version        0.2.4.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Export portals to various formats
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==



@@PLUGINSTART@@
//PLUGIN START ////////////////////////////////////////////////////////

window.plugin.multiexport = function() {};


/*********** MENUE ************************************************************/
window.plugin.multiexport.createmenu = function() {
    var htmldata = '<div class="multiExportSetbox">'
    + "<a onclick=\"window.plugin.multiexport.export('GPX','VIEW');\" title=\"Generate a GPX list of portals and location\">GPX Export from Map</a>"
    + "<a onclick=\"window.plugin.multiexport.export('CSV','VIEW');\" title=\"Generate a CSV list of portals and locations\">CSV Export from Map</a>"
    + "<a onclick=\"window.plugin.multiexport.export('MF','VIEW');\" title=\"Generate a list of portals for use with maxfield from current View\">Maxfield Export from Map</a>";
    if(plugin.drawTools)
    {
        htmldata += "<a onclick=\"window.plugin.multiexport.export('GPX','VIEWFIL');\" title=\"Generate a GPX list of portals and location\">GPX Export inside Polygon</a>"
            + "<a onclick=\"window.plugin.multiexport.export('CSV','VIEWFIL');\" title=\"Generate a CSV list of portals and locations\">CSV Export inside Polygon</a>"
            + "<a onclick=\"window.plugin.multiexport.export('MF','VIEWFIL');\" title=\"Generate a list of portals for use with maxfield from current View\">Maxfield Export inside Polygon</a>";
    }
    if(plugin.bookmarks)
    {
        htmldata += "<a onclick=\"window.plugin.multiexport.bkmrkmenu('GPX');\" title=\"Generate a GPX list of portals from Bookmarks\">GPX Export from Bookmarks</a>"
            + "<a onclick=\"window.plugin.multiexport.bkmrkmenu('CSV');\" title=\"Generate a CSV list of portals from Bookmarks\">CSV Export from Bookmarks</a>"
            + "<a onclick=\"window.plugin.multiexport.bkmrkmenu('MF');\" title=\"Generate a list of portals for use with maxfield from Bookmarks\">Maxfield Export from Bookmarks</a>";
    }
    htmldata += "</div>";
    window.dialog({
        title: "Multi Export Options",
        html: htmldata
    }).parent();
};

/*********** HELPER FUNCTION ****************************************************/
window.plugin.multiexport.portalinpolygon = function(portal,LatLngsObjectsArray)
{
    var portalCoords = portal.split(',');

    var x = portalCoords[0], y = portalCoords[1];

    var inside = false;
    for (var i = 0, j = LatLngsObjectsArray.length - 1; i < LatLngsObjectsArray.length; j = i++) {
        var xi = LatLngsObjectsArray[i]['lat'], yi = LatLngsObjectsArray[i]['lng'];
        var xj = LatLngsObjectsArray[j]['lat'], yj = LatLngsObjectsArray[j]['lng'];

        var intersect = ((yi > y) != (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

/*********** BOOKMARK MENUE ****************************************************/
window.plugin.multiexport.bkmrkmenu = function(type) {
    var htmlcontent = '<div class="multiExportSetbox">';
    var bookmarks = JSON.parse(localStorage[plugin.bookmarks.KEY_STORAGE]);
    for(var i in bookmarks.portals){
        htmlcontent += "<a onclick=\"window.plugin.multiexport.export('" +type+"','BKMRK','"+i+"');\""
            + "title=\"Generate GPX list\">" + bookmarks.portals[i].label + "</a>";
    }
    htmlcontent += '</div>';
    window.dialog({
        title: "Multi Export Options",
        html: htmlcontent
    }).parent();
};

/*********** ABSTRACT EXPORT FUNCTION ******************************************/
window.plugin.multiexport.export = function(type, source, bkmrkFolder)
{
    console.log(type);
    var o = [];
    var portals;
    var sourceTitle;
    var windowTitle;
    if(type === 'MF')
    {
        windowTitle = 'Maxfield Export From ';
    } else {
        windowTitle = type + ' Export From ';
    }
    if(localStorage['plugin-draw-tools-layer'])
    {
        var drawLayer = JSON.parse(localStorage['plugin-draw-tools-layer']);
    }
    if(source == 'BKMRK') {
        var bookmarks = JSON.parse(localStorage[plugin.bookmarks.KEY_STORAGE]);
        portals = bookmarks.portals[bkmrkFolder].bkmrk;
        windowTitle = windowTitle + 'Bookmarks';

    } else {
        portals = window.portals;
        windowTitle = windowTitle + 'current View';
    }
    if(type === 'GPX')
    {
        o.push("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        o.push("<gpx version=\"1.1\" "
               +"creator=\"IITC-Multisxporter\" "
               +"xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" "
               +"xmlns=\"http://www.topografix.com/GPX/1/1\" "
               +"xsi:schemaLocation=\"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd\""
               +">");
        o.push("<metadata>"
               +"<link href=\"https://ingress.com/intel\"></link>"
               +"</metadata>"
              );
    }
    portalLoop:
    for(var i in portals){
        var keys = 0;
        if(source === 'BKMRK'){
            var name = bookmarks.portals[bkmrkFolder].bkmrk[i].label;
            var latlng = bookmarks.portals[bkmrkFolder].bkmrk[i].latlng;
            if(plugin.keys.keys[bookmarks.portals[bkmrkFolder].bkmrk[i].guid]){
                keys = plugin.keys.keys[bookmarks.portals[bkmrkFolder].bkmrk[i].guid];
            }
        }else{
            var p = window.portals[i];
            var name = p.options.data.title;
            var latlng = p._latlng.lat + ',' +  p._latlng.lng;
            if(source === 'VIEWFIL'){
                for(var dl in drawLayer){
                    if(drawLayer[dl].type === 'polygon'){
                        console.log(latlng);
                        console.log(drawLayer[dl]);
                        if(!window.plugin.multiexport.portalinpolygon(latlng,drawLayer[dl].latLngs)) continue portalLoop;
                    }
                }
            }

            if(plugin.keys.keys[i]){
                keys = plugin.keys.keys[i];
            }
            var b = window.map.getBounds();
            // skip if not currently visible
            if (p._latlng.lat < b._southWest.lat || p._latlng.lng < b._southWest.lng || p._latlng.lat > b._northEast.lat || p._latlng.lng > b._northEast.lng) continue;
        }
        switch(type){
            case 'MF':
                o.push(name + ";https://www.ingress.com/intel?ll=" + latlng + "&z=18&pll=" + latlng + ";" + keys);
                break;
            case 'CSV':
                o.push("\"" + name + "\"," + latlng.split(',')[0] + "," + latlng.split(',')[1]);
                break;
            case 'GPX':
                lat = latlng.split(',')[0];
                lng = latlng.split(',')[1];
                iitcLink = "https://www.ingress.com/intel?ll=" + lat + "," + lng + "&amp;z=17&amp;pll=" + lat + "," + lng;
                gmapLink = "http://maps.google.com/?ll=" + lat + "," + lng + "&amp;q=" + lat + ","  + lng;
                o.push("<wpt lat=\""+ lat + "\" lon=\""  + lng + "\">"
                       +"<name>" + name + "</name>"
                       +"<desc>" + "Lat/Lon: " + lat + "," + lng + "\n"
                       + "Intel: " + iitcLink + "\n"
                       + "GMap: " + gmapLink + "\n"
                       +"</desc>\n"
                       +"<link href=\"" + iitcLink + "\"></link>\n"
                       +"</wpt>"
                      );
                break;
        }
    }
    if(type === 'GPX')
    {
        o.push("</gpx>");
    }


    var dialog = window.dialog({
        title: windowTitle,
        dialogClass: 'ui-dialog-maxfieldexport',
        html: '<textarea readonly id="idmExport" style="width: 600px; height: ' + ($(window).height() / 2) + 'px; margin-top: 5px;"></textarea>'
        + '<p><a onclick="$(\'.ui-dialog-maxfieldexport textarea\').select();">Select all</a></p>'
    }).parent();

    dialog.css("width", 630).css({
        "top": ($(window).height() - dialog.height()) / 2,
        "left": ($(window).width() - dialog.width()) / 2
    });

    $("#idmExport").val(o.join("\n"));

    return dialog;
};


/*********** PLUGIN SETUP *****************************************************/
// setup function called by IITC
var setup = function() {
  $("#toolbox").append("<a onclick=\"window.plugin.multiexport.createmenu();\" title=\"Export the currently visible portals\">Multi Export</a>");
  $('head').append('<style>' +
             '.multiExportSetbox > a { display:block; color:#ffce00; border:1px solid #ffce00; padding:3px 0; margin:10px auto; width:80%; text-align:center; background:rgba(8,48,78,.9); }'+
             '</style>');

}


//PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
