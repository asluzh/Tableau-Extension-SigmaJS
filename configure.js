$(document).ready(function() {
  tableau.extensions.initializeDialogAsync().then(function(openPayload) {
    let dashboard = tableau.extensions.dashboardContent.dashboard;
    dashboard.worksheets.forEach(function(worksheet) {
      $("#selectWorksheet").append(
        "<option value='" + worksheet.name + "'>" + worksheet.name + "</option>"
      );
    });
    var worksheetName = tableau.extensions.settings.get("sheet");
    if (worksheetName != undefined) {
      $("#selectWorksheet").val(worksheetName);
      columnsUpdate();
    }

    $("#selectWorksheet").on("change", "", function(e) {
      columnsUpdate();
    });
    $("#cancel").click(closeDialog);
    $("#save").click(saveButton);
    console.log("configure ready");
    // $(".select").select2();
  });
});

function columnsUpdate() {
  var worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
  var worksheetName = $("#selectWorksheet").val();

  var worksheet = worksheets.find(function(sheet) {
    return sheet.name === worksheetName;
  });

  worksheet.getSummaryDataAsync({ maxRows: 1 }).then(function(sumdata) {
    var worksheetColumns = sumdata.columns;
    $("#selectSourceNode").text("");
    $("#selectSourceType").text("");
    $("#selectTargetNode").text("");
    $("#selectTargetType").text("");
    // var counter = 1;
    worksheetColumns.forEach(function(current_value) {
      $("#selectSourceNode").append(
        "<option value='" +
          // counter +
          current_value.fieldName +
          "'>" +
          current_value.fieldName +
          "</option>"
      );
      $("#selectSourceType").append(
        "<option value='" +
          // counter +
          current_value.fieldName +
          "'>" +
          current_value.fieldName +
          "</option>"
      );
      $("#selectTargetNode").append(
        "<option value='" +
          // counter +
          current_value.fieldName +
          "'>" +
          current_value.fieldName +
          "</option>"
      );
      $("#selectTargetType").append(
        "<option value='" +
          // counter +
          current_value.fieldName +
          "'>" +
          current_value.fieldName +
          "</option>"
      );
      // counter++;
    });
    $("#selectSourceNode").val(tableau.extensions.settings.get("source_node"));
    $("#selectSourceType").val(tableau.extensions.settings.get("source_type"));
    $("#selectTargetNode").val(tableau.extensions.settings.get("target_node"));
    $("#selectTargetType").val(tableau.extensions.settings.get("target_type"));
  });
}

function reloadSettings() {}

function closeDialog() {
  console.log("cancel dialog");
  tableau.extensions.ui.closeDialog("10");
}

function saveButton() {
  console.log("save button");
  tableau.extensions.settings.set("sheet", $("#selectWorksheet").val());
  tableau.extensions.settings.set("source_node", $("#selectSourceNode").val());
  tableau.extensions.settings.set("source_type", $("#selectSourceType").val());
  tableau.extensions.settings.set("target_node", $("#selectTargetNode").val());
  tableau.extensions.settings.set("target_type", $("#selectTargetType").val());

  tableau.extensions.settings.saveAsync().then(currentSettings => {
    tableau.extensions.ui.closeDialog("10");
  });
}
