// Load the Visualization API and the corechart package.
google.charts.load('current', {'packages':['corechart']});

// Set a callback to run when the Google Visualization API is loaded.
//google.charts.setOnLoadCallback(drawChart);

// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
function drawChart(podatki) {

    // Create the data table.
    var data = google.visualization.arrayToDataTable(podatki);
    var options = {
        title: '',
        hAxis: {title: 'Sistolični tlak', minValue: 0, maxValue: 200, gridlines: {count: 21, color: 'white'}},
        vAxis: {title: 'Diastolični tlak', minValue: 0, maxValue: 130, gridlines: {count: 14, color: 'white'}},
        legend: 'none',
        chartArea: {left:90, top:25, width:420, height:273},
        backgroundColor: 'none'
    };

    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.ScatterChart(document.getElementById('chart_div'));
    chart.draw(data, options);

}