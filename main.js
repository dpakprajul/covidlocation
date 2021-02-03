
// custom variables
var clickedcoordinates = []
var geojsonobj = []
// adding layer

var heatmaplayer, attributelayer, clusterlayer, clustercolorlayer, movendfunction



// defining view
var view = new ol.View({
  center: [9328878.98717274, 3276589.7973750546],
  zoom: 7
})
//  basemaps
var basemap =
  new ol.layer.Tile({
    source: new ol.source.OSM()
  })
// layer array 
var layerarray = [basemap]
// init the map
var map = new ol.Map({
  view: view,
  layers: layerarray,
  target: 'map'
});



// add draw layer 
// to create the layer
//  => to define the source
// => define the style
// =>define the layer
//  => to add the layer to map

// create the layer
var drawsource = new ol.source.Vector()

// define the style
// skip 
// define the layer

var drawlayer = new ol.layer.Vector({
  source: drawsource
})

// adding to map
map.addLayer(drawlayer)

// init the draw interaction
var draw = new ol.interaction.Draw({
  type: 'Point',
  source: drawsource

})
// making empty while drawing 
draw.on("drawstart", function (evt) {
  drawsource.clear()
})
// ending drawing
draw.on("drawend", function (evt) {
  console.log("click coordinate is" + evt.feature.getGeometry().getCoordinates())
  // alert("added the point feature")
  clickedcoordinates = evt.feature.getGeometry().getCoordinates()
  // showing the model 
  $('#pointadding').modal('show');
  map.removeInteraction(draw)
})


// adding function to start drawing
function startdrawing() {
  // adding interaction to map
  map.addInteraction(draw)
}



// save data from form to database
function savedata() {
  var name = $('#username').val()
  var condition = $('#usercondition').val()
  var long = clickedcoordinates[0]
  var lat = clickedcoordinates[1]
  if (name != '' && condition != '' && long != '') {
    $.ajax({
      url: 'save.php',
      type: 'POST',
      data: {
        name: name,
        condition: condition,
        long: long,
        lat: lat
      },
      success: function (dataResult) {
        alert("added sucessful");
        $('#pointadding').modal('hide');
        //     var dataResult=JSON.parse(dataResult)
        //     if(dataResult.statusCode == 200){
        //       alert("user added sucessfuly")
        //     }
        //     else{
        //       alert("something went wrong")
        //     }
      }
    })

  } else {
    alert("Enter the all Information")
  }
}
// adding the geojson object
function creatingGeojson(arrayofdata) {
  geojsonobj['type'] = "FeatureCollection"
  var features = []
  for (i = 0; i < arrayofdata.length; i++) {
    var fetobj = {}
    fetobj['type'] = 'Feature'
    fetobj['properties'] = { 'condition': arrayofdata[i].condition }
    fetobj['geometry'] = JSON.parse(arrayofdata[i].st_asgeojson)
    features.push(fetobj)
  }
  geojsonobj['features'] = features


  // defing the data source
  var source = new ol.source.Vector({
    features: (new ol.format.GeoJSON().readFeatures(geojsonobj))
  })
  // generating the Heat Maps

  heatmaplayer = new ol.layer.Heatmap({
    source: source
  })
  map.addLayer(heatmaplayer)
  heatmaplayer.setVisible(false)
  // generating the map based in attribution
  attributelayer = new ol.layer.Vector({
    source: source,

    style: function (feature) {
      console.log(feature.values_.condition)
      if (feature.values_.condition == 'Healthy') {

        return new ol.style.Style({
          image: new ol.style.Circle({
            fill: new ol.style.Fill({
              color: '#0000ff'
            }),
            radius: 7
          })
        })
      } else if (feature.values_.condition == 'covid') {
        return new ol.style.Style({
          image: new ol.style.Circle({
            fill: new ol.style.Fill({
              color: '#ff0000'
            }),
            radius: 7
          })
        })
      }
    }
  })

  map.addLayer(attributelayer)
  attributelayer.setVisible(false)

  // // clustering 
  var clusterSource = new ol.source.Cluster({
    distance: parseInt(40, 10),
    source: source
  });




  var styleCache = {};
  clusterlayer = new ol.layer.Vector({
    source: clusterSource,
    style: function (feature) {
      var size = feature.get('features').length;
      var style = styleCache[size];
      if (!style) {
        style = new ol.style.Style({
          image: new ol.style.Circle({
            radius: 10,
            stroke: new ol.style.Stroke({
              color: '#fff'
            }),
            fill: new ol.style.Fill({
              color: '#3399CC'
            })
          }),
          text: new ol.style.Text({
            text: size.toString(),
            fill: new ol.style.Fill({
              color: '#fff'
            })
          })
        });
        styleCache[size] = style;
      }
      return style;
    }
  });

  map.addLayer(clusterlayer)
  clusterlayer.setVisible(false)

  // Interaction to move the source features
  var modify = new ol.interaction.Modify({ source: source });
  modify.setActive(false);
  map.addInteraction(modify);
  var layerSource = new ol.layer.Vector({ source: source, visible: false })
  map.addLayer(layerSource);

  var hexbin, layer, binSize;
  var style = 'color';
  var min, max, maxi;
  var minRadius = 1;
  var styleFn = function (f, res) {
    switch (style) {
      // Display a point with a radius 
      // depending on the number of objects in the aggregate.
      case 'point': {
        var radius = Math.round(binSize / res + 0.5) * Math.min(1, f.get('features').length / max);
        if (radius < minRadius) radius = minRadius;
        return [new ol.style.Style({
          image: new ol.style.RegularShape({
            points: 6,
            radius: radius,
            fill: new ol.style.Fill({ color: [0, 0, 255] }),
            rotateWithView: true
          }),
          geometry: new ol.geom.Point(f.get('center'))
        })
          //, new ol.style.Style({ fill: new ol.style.Fill({color: [0,0,255,.1] }) })
        ];
      }
      // Display the polygon with a gradient value (opacity) 
      // depending on the number of objects in the aggregate.
      case 'gradient': {
        var opacity = Math.min(1, f.get('features').length / max);
        return [new ol.style.Style({ fill: new ol.style.Fill({ color: [0, 0, 255, opacity] }) })];
      }
      // Display the polygon with a color
      // depending on the number of objects in the aggregate.
      case 'color':
      default: {
        var color;
        if (f.get('features').length > max) color = [136, 0, 0, 1];
        else if (f.get('features').length > min) color = [255, 165, 0, 1];
        else color = [0, 136, 0, 1];
        return [new ol.style.Style({ fill: new ol.style.Fill({ color: color }) })];
      }
    }
  };

  // Create HexBin and calculate min/max
  function reset(getsize) {
    var size = getsize;
    if (clustercolorlayer) map.removeLayer(clustercolorlayer);
    binSize = size;
    var features;
    hexbin = new ol.source.HexBin({
      source: source,		// source of the bin
      size: size			// hexagon size (in map unit)
    });
    clustercolorlayer = new ol.layer.Vector({
      source: hexbin,
      opacity: 0.5,
      style: styleFn,
      renderMode: 'image'
    });
    features = hexbin.getFeatures();
    // Calculate min/ max value
    min = Infinity;
    max = 0;
    for (var i = 0, f; f = features[i]; i++) {
      var n = f.get('features').length;
      if (n < min) min = n;
      if (n > max) max = n;
    }
    var dl = (max - min);
    maxi = max;
    min = Math.max(1, Math.round(dl / 4));
    max = Math.round(max - dl / 3);
    // $(".min").text(min);
    // $(".max").text(max);
    // Add layer
    map.addLayer(clustercolorlayer);

  }
    // function
    movendfunction = function(evt){
      var currentZoomlevel = map.getView().getZoom()
      if (currentZoomlevel >12){
          reset (5000)
      } else  if (currentZoomlevel >11){
          reset (10000)
      } else  if (currentZoomlevel >9){
          reset (15000)
      } else  if (currentZoomlevel >8){
          reset (25000)
      } else  if (currentZoomlevel >8){
          reset (35000)
      } else  if (currentZoomlevel >6){
          reset (45000)
      } else  if (currentZoomlevel >5){
          reset (55000)
      } 
  }
    

  map.on('moveend', movendfunction)
}

// adding layer according to function
function addLayer(type) {
  if (type == 'heatmap') {
    heatmaplayer.setVisible(true)
    attributelayer.setVisible(false)
    clusterlayer.setVisible(false)
    clustercolorlayer.setVisible(false)
    map.un('moveend', movendfunction)
  }
  else if (type == 'attribute') {
    heatmaplayer.setVisible(false)
    attributelayer.setVisible(true)
    clusterlayer.setVisible(false)
    clustercolorlayer.setVisible(false)
    map.un('moveend', movendfunction)
  }
  else if (type == 'cluster') {
    heatmaplayer.setVisible(false)
    attributelayer.setVisible(false)
    clusterlayer.setVisible(true)
    clustercolorlayer.setVisible(false)
    map.un('moveend', movendfunction)
  }
  else if (type == 'clustercolor') {
    heatmaplayer.setVisible(false)
    attributelayer.setVisible(false)
    clusterlayer.setVisible(false)
    clustercolorlayer.setVisible(true)
    map.on('moveend', movendfunction)
  }
}
// creating the box and moving into the extends
var dragebox = new ol.interaction.DragBox({})
// adding event in the drage box
dragebox.on('boxstart', function(evt){
  console.log("dragebox start")
})

// adding the zoom in feature in the dragebox end
dragebox.on("boxend",function(evt){
  console.log("dragebox end");
  var exten = dragebox.getGeometry().getExtent()
  console.log(exten)
  map.getView().fit(exten);
})


// adding interaction in the map
map.addInteraction(dragebox)

// adding interaction to insert any vector layer using dragand drop
var dragesource = new ol.source.Vector()

var dragelayer = new ol.layer.Vector({
  source:dragesource
})
map.addLayer(dragelayer)
// adding the drage and drop
var drageanddrop = new ol.interaction.DragAndDrop({
  formatConstructors: [ol.format.GeoJSON],
  source:dragesource
})
map.addInteraction(drageanddrop)
