  // create varaibles for each of the html id tags
var id = d3.select("#selDataset");
var table = d3.select("#sample-metadata");
var bar = d3.select("#bar");
var bubble = d3.select("bubble");
var gauge = d3.select("gauge");

// this function populates dropdown menu with IDs and draw charts by default (using the first ID)
function init() {
    resetData(); // reset any previous data; see function definition below
    d3.json("data/samples.json").then((data => {
        data.names.forEach((name => {id.append("option").text(name);}));
        plotCharts(id.property("value")); // plot charts with value ID changed in drop down menu; see function definition below
    })); 
}

// this function resets the html id tags
function resetData() {
    table.html("");
    bar.html("");
    bubble.html("");
    gauge.html("");
}; 

// create a function to read JSON and plot charts
function plotCharts(id) {
    d3.json("data/samples.json").then((data => {
        //filter the metadata for the ID selected
        var filtered_md = data.metadata.filter(participant => participant.id == id)[0]; //filter the metadata (md) on the id selected, and rturn back the "id" key 

        var wfreq = filtered_md.wfreq; //this variable will be for the gauge chart later

        //for selected id, do the following to get info into demographic info table
        Object.entries(filtered_md).forEach(([key, value]) => {
            table.append("p").text(`${key}: ${value}`);
        });

        // filter the samples data for the ID selected
        var filtered_samples = data.samples.filter(sample => sample.id == id)[0];

        // create empty arrays to store sample data
        var otu_ids = [];
        var otu_labels = [];
        var sample_values = [];

        // Iterate through each key and value in the samples data and store to empty lists above for plotting
        Object.entries(filtered_samples).forEach(([key, value]) => {
            switch (key) {
                case "otu_ids":
                    otu_ids.push(value);
                    break;
                case "sample_values":
                    sample_values.push(value);
                    break;
                case "otu_labels":
                    otu_labels.push(value);
                    break;
                default:
                    break;
            }
        });

        // slice and reverse the arrays to get the top 10 values, labels and IDs
        var top_otu_ids = otu_ids[0].slice(0, 10).reverse();
        var topotu_labels = otu_labels[0].slice(0, 10).reverse();
        var topsample_values = sample_values[0].slice(0, 10).reverse();

        // use the map function to store the IDs with "OTU" for labelling y-axis
        var top_otu_ids_form = top_otu_ids.map(otuID => "OTU " + otuID);

        //plotting the bar chart
        var bar_trace = {
            x: topsample_values,
            y: top_otu_ids_form,
            text: topotu_labels,
            type: 'bar',
            orientation: 'h',
            marker: {color: 'rgb(29,145,192)'}
        };

        var bar_data = [bar_trace];

        var bar_layout = {
            height: 500,
            width: 600,
            font: {family: 'Quicksand'},
            hoverlabel: {font: {family: 'Quicksand'}},
            title: {
                text: `<b>Top OTUs for Test Subject ${id}</b>`,
                font: {size: 18,color: 'rgb(34,94,168)'}
            },
            xaxis: {
                title: "<b>Sample values<b>",
                color: 'rgb(34,94,168)'
            },
            yaxis: {
                tickfont: { size: 14 }
            }
        }
        Plotly.newPlot("bar", bar_data, bar_layout);

        //plotting the bubble chart
        var bubble_trace = {
            x: otu_ids[0],
            y: sample_values[0],
            text: otu_labels[0],
            mode: 'markers',
            marker: {
                size: sample_values[0],
                color: otu_ids[0],
                colorscale: 'YlGnBu'
            }
        };

        var bubble_data = [bubble_trace];

        var bubble_layout = {
            font: {family: 'Quicksand'},
            hoverlabel: {font: {family: 'Quicksand'}},
            xaxis: {
                title: "<b>OTU Id</b>",
                color: 'rgb(34,94,168)'
            },
            yaxis: {
                title: "<b>Sample Values</b>",
                color: 'rgb(34,94,168)'
            },
            showlegend: false,
        };
        Plotly.newPlot('bubble', bubble_data, bubble_layout);

        //plotting the gauge chart
        // if wfreq has a null value, make it zero for calculating pointer later
        if (wfreq == null) {wfreq = 0;}

        // create an indicator trace for the gauge chart
        var gauge_trace = {
            domain: { x: [0, 1], y: [0, 1] },
            value: wfreq,
            type: "indicator",
            mode: "gauge",
            gauge: {
                axis: {
                    range: [0, 9],
                    tickmode: 'linear',
                    tickfont: {size: 15}
                },
                bar: { color: 'rgba(8,29,88,0)' }, // makes gauge sections transparent to show the pointer
                steps: [
                    { range: [0, 1], color: 'rgb(255,255,217)' },
                    { range: [1, 2], color: 'rgb(237,248,217)' },
                    { range: [2, 3], color: 'rgb(199,233,180)' },
                    { range: [3, 4], color: 'rgb(127,205,187)' },
                    { range: [4, 5], color: 'rgb(65,182,196)' },
                    { range: [5, 6], color: 'rgb(29,145,192)' },
                    { range: [6, 7], color: 'rgb(34,94,168)' },
                    { range: [7, 8], color: 'rgb(37,52,148)' },
                    { range: [8, 9], color: 'rgb(8,29,88)' }
                ]
            }
        };

        // determine angle for each wfreq segment on the chart
        var angle = (wfreq / 9) * 180;

        // calculate end points for triangle pointer path
        var degrees = 180 - angle, radius = .8;
        var radians = degrees * Math.PI / 180;
        var x = radius * Math.cos(radians);
        var y = radius * Math.sin(radians);

        // Path: to create needle shape (triangle). Initial coordinates of two of the triangle corners plus the third calculated end tip that points to the appropriate segment on the gauge 
        // M aX aY L bX bY L cX cY Z
        var mainPath = 'M -.0 -0.025 L .0 0.025 L ',
            cX = String(x),
            cY = String(y),
            pathEnd = ' Z';
        var path = mainPath + cX + " " + cY + pathEnd;

        gauge_colors = ['rgb(8,29,88)', 'rgb(37,52,148)', 'rgb(34,94,168)', 'rgb(29,145,192)', 'rgb(65,182,196)', 'rgb(127,205,187)', 'rgb(199,233,180)', 'rgb(237,248,217)', 'rgb(255,255,217)', 'white']

        // create a trace to draw the circle where the needle is centered
        var needle_trace = {
            type: 'scatter',
            showlegend: false,
            x: [0],
            y: [0],
            marker: { size: 35, color: '850000' },
            name: wfreq,
            hoverinfo: 'name'
        };

        // create a data array from the two traces
        var gauge_data = [gauge_trace, needle_trace];

        // define a layout for the chart
        var gauge_layout = {

            // draw the needle pointer shape using path defined above
            shapes: [{
                type: 'path',
                path: path,
                fillcolor: '850000',
                line: {color: '850000'}
            }],
            font: {family: 'Quicksand'},
            hoverlabel: {font: {family: 'Quicksand',size: 16}},
            title: {
                text: `<b>Belly Button Washing Frequency (scrubs per week)</b><br><b>For Test Subject ${id}</b><br><br>`,
                font: {size: 18, color: 'rgb(34,94,168)'},
            },
            height: 500,
            width: 500,
            xaxis: {
                zeroline: false,
                showticklabels: false,
                showgrid: false,
                range: [-1, 1],
                fixedrange: true // disable zoom
            },
            yaxis: {
                zeroline: false,
                showticklabels: false,
                showgrid: false,
                range: [-0.5, 1.5],
                fixedrange: true // disable zoom
            }
        };
        Plotly.newPlot('gauge', gauge_data, gauge_layout);

    }));

};

// when there is a change in the dropdown select menu, this function is called with the ID as a parameter
function optionChanged(id) {
    resetData();
    plotCharts(id);
}

// call the init() function for default data
init();