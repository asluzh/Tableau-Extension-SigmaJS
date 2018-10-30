$(document).ready(function() {
  tableau.extensions.initializeAsync({ configure: configure }).then(function() {
    // define an empty graph
    const inputWs = tableau.extensions.dashboardContent.dashboard.worksheets.find(
      function(w) {
        return w.name.substr(0, 5) === "Graph";
      }
    );
    var renderGraph = function() {
      inputWs.getSummaryDataAsync().then(function(dataTable) {
        var g = {
          nodes: [],
          edges: []
        };
        let node1idx = 0; //dataTable.columns.find(column => column.fieldName === "node1").index;
        let node2idx = 1; //dataTable.columns.find(column => column.fieldName === "node2").index;
        let nodelist = [];
        let edgelist = [];
        for (let i = 0; i < dataTable.data.length; i++) {
          let row = dataTable.data[i];
          nodelist.push(row[node1idx].value);
          nodelist.push(row[node2idx].value);
          edgelist.push([
            row[node1idx].value,
            row[node2idx].value,
            row[2].value
          ]);
        }
        let icons = ["\uF1AD", "\uF187", "\uF021", "\uF007"];
        let colors = ["#338", "#833"];
        let nodevalues = nodelist.filter(function(el, i, arr) {
          return arr.indexOf(el) === i;
        }); // unique
        // console.log(nodevalues);
        for (let i = 0; i < nodevalues.length; i++)
          g.nodes.push({
            id: "n" + nodevalues[i],
            label: nodevalues[i],
            x: Math.random(),
            y: Math.random(),
            size: Math.random() * 2 + 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            icon: {
              font: "FontAwesome", // or 'FontAwesome' etc..
              content: icons[Math.floor(Math.random() * icons.length)], // or custom fontawesome code eg. "\uF129"
              scale: 0.9, // 70% of node size
              color: "#fff" // foreground color (white)
            },
            data: {
              name: "Jean",
              gender: "Male",
              age: 28,
              city: "Paris"
            }
          });
        for (let i = 0; i < edgelist.length; i++)
          g.edges.push({
            id: "e" + i,
            // label: "Amount: " + edgelist[i][2],
            source: "n" + edgelist[i][0],
            target: "n" + edgelist[i][1],
            size: edgelist[i][2], //Math.random() * 3 + 1,
            color: "rgba(10,20,30,0.35)",
            type: "curvedArrow" // arrow, curvedArrow
          });
        // Instantiate sigma:
        $("#graph-container").empty();
        sigma.renderers.def = sigma.renderers.canvas;
        var sigmaInstance = new sigma({
          graph: g,
          container: "graph-container",
          settings: {
            minNodeSize: 3,
            maxNodeSize: 15,
            minEdgeSize: 1,
            maxEdgeSize: 3,
            edgeLabelSize: "proportional",
            enableEdgeHovering: true,
            edgeHoverExtremities: false, // also highlight nodes on edge hover
            drawLabels: false
            //labelThreshold: 25 // which zoom level is enough to display the labels
            // edgeHoverSizeRatio: 2,
            // nodeHaloColor: "#ecf0f1",
            // edgeHaloColor: "#ecf0f1",
            // nodeHaloSize: 50,
            // edgeHaloSize: 10
            // drawGlyphs: true,
          }
        });
        //sigmaInstance.startForceAtlas2(); // not stable, probably needs additional cool-down parameter
        var frListener = sigma.layouts.fruchtermanReingold.configure(
          sigmaInstance,
          {
            iterations: 500,
            easing: "quadraticInOut",
            duration: 800
          }
        );

        // // debug events
        // frListener.bind("start stop interpolate", function(e) {
        //   console.log(e.type);
        // });

        // Start the Fruchterman-Reingold algorithm:
        sigma.layouts.fruchtermanReingold.start(sigmaInstance);
        // $("#rearrange").addEventListener(
        //   "click",
        //   sigma.layouts.fruchtermanReingold.start(sigmaInstance)
        // );
        // Initialize the dragNodes plugin:
        var dragListener = sigma.plugins.dragNodes(
          sigmaInstance,
          sigmaInstance.renderers[0]
        );
      });
    };
    inputWs.addEventListener(
      tableau.TableauEventType.FilterChanged,
      function() {
        console.log("FilterChanged");
        renderGraph();
      }
    );
    tableau.extensions.dashboardContent.dashboard
      .getParametersAsync()
      .then(function(parameters) {
        parameters.forEach(function(p) {
          if (p.name === "Max Node") {
            p.addEventListener(
              tableau.TableauEventType.ParameterChanged,
              function() {
                console.log("ParameterChanged");
                renderGraph();
              }
            );
          }
        });
      });
    renderGraph();
    // tableau.extensions.dashboardContent.dashboard.worksheets
    //   .find(w => w.name === "Summary Data")
    //   .getSummaryDataAsync()
    //   .then(dataTable => {
    //     for (let row of dataTable.data) {
    //       console.log(row);
    //     }
    //   });

    tableau.extensions.settings.addEventListener(
      tableau.TableauEventType.SettingsChanged,
      function(settingsEvent) {}
    );
  });
});

function configure() {
  const popupUrl = window.location.origin + "configure.html";
  tableau.extensions.ui
    .displayDialogAsync(popupUrl, "Payload Message", {
      height: 500,
      width: 500
    })
    .then(function(closePayload) {})
    .catch(function(error) {
      switch (error.errorCode) {
        case tableau.ErrorCodes.DialogClosedByUser:
          console.log("Dialog was closed by user");
          break;
        default:
          console.error(error.message);
      }
    });
}
