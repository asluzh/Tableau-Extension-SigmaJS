$(document).ready(function() {
  tableau.extensions.initializeDialogAsync().then(function(openPayload) {
    let dashboard = tableau.extensions.dashboardContent.dashboard;
    dashboard.worksheets.forEach(function(worksheet) {
      $("#selectWorksheetNodes").append(
        "<option value='" + worksheet.name + "'>" + worksheet.name + "</option>"
      );
      $("#selectWorksheetEdges").append(
        "<option value='" + worksheet.name + "'>" + worksheet.name + "</option>"
      );
    });
    var worksheetNameNodes = tableau.extensions.settings.get("sheet_nodes");
    if (worksheetNameNodes != undefined) {
      $("#selectWorksheetNodes").val(worksheetNameNodes);
      columnsUpdateNodes();
    }
    var worksheetNameEdges = tableau.extensions.settings.get("sheet_edges");
    if (worksheetNameEdges != undefined) {
      $("#selectWorksheetEdges").val(worksheetNameEdges);
      columnsUpdateEdges();
    }
    $("#selectWorksheetNodes").on("change", "", function(e) {
      columnsUpdateNodes();
    });
    $("#selectWorksheetEdges").on("change", "", function(e) {
      columnsUpdateEdges();
    });
    var nodeColors = tableau.extensions.settings.get("node_colors");
    if (nodeColors != undefined) {
      $("#inputNodeColors").val(nodeColors);
    }
    $("#cancel").click(closeDialog);
    $("#save").click(saveButton);
    console.log("configure ready");
  });
});

function columnsUpdateNodes() {
  var worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
  var worksheetNameNodes = $("#selectWorksheetNodes").val();

  var worksheetNodes = worksheets.find(function(sheet) {
    return sheet.name === worksheetNameNodes;
  });

  worksheetNodes.getSummaryDataAsync({ maxRows: 1 }).then(function(sumdata) {
    var worksheetColumns = sumdata.columns;
    $("#selectFieldNodeId").text("");
    $("#selectFieldNodeType").text("");
    worksheetColumns.forEach(function(current_value) {
      $("#selectFieldNodeId").append(
        "<option value='" +
          current_value.fieldName +
          "'>" +
          current_value.fieldName +
          "</option>"
      );
      $("#selectFieldNodeType").append(
        "<option value='" +
          current_value.fieldName +
          "'>" +
          current_value.fieldName +
          "</option>"
      );
    });
    var nodeId = tableau.extensions.settings.get("field_node_id");
    if (nodeId != undefined) {
      $("#selectFieldNodeId").val(nodeId);
    }
    var nodeType = tableau.extensions.settings.get("field_node_type");
    if (nodeType != undefined) {
      $("#selectFieldNodeType").val(nodeType);
    }
  });
}

function columnsUpdateEdges() {
  var worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
  var worksheetNameEdges = $("#selectWorksheetEdges").val();

  var worksheetEdges = worksheets.find(function(sheet) {
    return sheet.name === worksheetNameEdges;
  });

  worksheetEdges.getSummaryDataAsync({ maxRows: 1 }).then(function(sumdata) {
    var worksheetColumns = sumdata.columns;
    $("#selectFieldSourceNode").text("");
    $("#selectFieldTargetNode").text("");
    $("#selectFieldAmount").text("");
    // var counter = 1;
    worksheetColumns.forEach(function(current_value) {
      $("#selectFieldSourceNode").append(
        "<option value='" +
          current_value.fieldName +
          "'>" +
          current_value.fieldName +
          "</option>"
      );
      $("#selectFieldTargetNode").append(
        "<option value='" +
          current_value.fieldName +
          "'>" +
          current_value.fieldName +
          "</option>"
      );
      $("#selectFieldAmount").append(
        "<option value='" +
          current_value.fieldName +
          "'>" +
          current_value.fieldName +
          "</option>"
      );
    });
    var sourceNode = tableau.extensions.settings.get("field_source_node");
    if (sourceNode != undefined) {
      $("#selectFieldSourceNode").val(sourceNode);
    }
    var targetNode = tableau.extensions.settings.get("field_target_node");
    if (targetNode != undefined) {
      $("#selectFieldTargetNode").val(targetNode);
    }
    var amount = tableau.extensions.settings.get("field_amount");
    if (amount != undefined) {
      $("#selectFieldAmount").val(amount);
    }
  });
}

function reloadSettings() {}

function closeDialog() {
  console.log("cancel dialog");
  tableau.extensions.ui.closeDialog("10");
}

function saveButton() {
  console.log("save button");
  tableau.extensions.settings.set(
    "sheet_nodes",
    $("#selectWorksheetNodes").val()
  );
  tableau.extensions.settings.set(
    "sheet_edges",
    $("#selectWorksheetEdges").val()
  );
  tableau.extensions.settings.set(
    "field_source_node",
    $("#selectFieldSourceNode").val()
  );
  tableau.extensions.settings.set(
    "field_target_node",
    $("#selectFieldTargetNode").val()
  );
  tableau.extensions.settings.set(
    "field_amount",
    $("#selectFieldAmount").val()
  );
  tableau.extensions.settings.set(
    "field_node_id",
    $("#selectFieldNodeId").val()
  );
  tableau.extensions.settings.set(
    "field_node_type",
    $("#selectFieldNodeType").val()
  );
  tableau.extensions.settings.set("node_colors", $("#inputNodeColors").val());

  tableau.extensions.settings.saveAsync().then(currentSettings => {
    tableau.extensions.ui.closeDialog("10");
  });
}
