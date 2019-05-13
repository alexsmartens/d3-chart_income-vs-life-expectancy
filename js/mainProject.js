// Canvas parameters
var margin = {top: 100, right: 10, bottom: 75, left: 75},
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

// Construct chart
let canvas = d3.select("#chart-area")
                .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom),
    chart = canvas.append("g")
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

// Scales and legend
let y = d3.scaleLinear()
          .range([height, 0])
          .nice(),
    yAxisCall= d3.axisLeft(y),

    x = d3.scaleLog()
          .range([0, width])
          .base(10),
    xAxisCall = d3.axisBottom(x)
        .ticks(3)
        .tickValues([400, 4000, 40000])
        .tickFormat(d => "$" + d),
          
    area = d3.scaleLinear()
             .range([70, 3000]),

    continentColor = d3.scaleOrdinal()
                       .range(d3.schemeCategory10),
    
    legend = chart.append("g")
        .attr("transform", "translate(" + (width - 10) + "," + (height - 125) + ")");
    


// Additional parameters
let timeInterval = 100,
    time = 0,
    interval,
    data,
    dataLength;

// Tooltip
let tip = d3.tip().attr('class', 'd3-tip')
    .html(function(d) {
        let text = "<strong>Country:</strong> <span style='color:red'>" + d.country + "</span><br>";
        text += "<strong>Continent:</strong> <span style='color:red;text-transform:capitalize'>" + d.continent + "</span><br>";
        text += "<strong>Life Expectancy:</strong> <span style='color:red'>" + d3.format(".2f")(d.life_exp) + "</span><br>";
        text += "<strong>GDP Per Capita:</strong> <span style='color:red'>" + d3.format("$,.0f")(d.income) + "</span><br>";
        text += "<strong>Population:</strong> <span style='color:red'>" + d3.format(",.0f")(d.population) + "</span><br>";
        return text;
    });
chart.call(tip);

// // Add chart title
// chart.append("text")
//     .attr("class", "x-axis-label")
//     .attr("x", width/2)
//     .attr("y", -50)
//     .attr("text-anchor", "middle")
//     .attr("font-size", 18);

// Add axes labels
chart.append("text")
    .attr("class", "y-axis-label")
    .attr("x", -height/2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("transform","rotate(-90)")
    .text("Life Expectancy (years)");
chart.append("text")
    .attr("class", "x axis-label")
    .attr("x", width/2)
    .attr("y", height + 50)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .text("GDP Per Capita");

// Add current year
let currentYearLabel = chart.append("text")
    .attr("class", "current-year")
    .attr("x", width)
    .attr("y", height - 10)
    .attr("text-anchor", "end")
    .attr("font-size", 40)
    .attr("fill", "gray");

// Button controllers
$("#play-button")
    .on("click", function(){
        let button = $(this);
        if (button.text() === "Play"){
            button.text("Pause");
            interval = setInterval(step, timeInterval);            
        } else {
            button.text("Play");
            clearInterval(interval);
        }
    })
$("#reset-button")
    .on("click", function(){
        time = 0;
        updateChart(data[0]);
    })
$("#continent-select")
    .on("change", function(){
        updateChart(data[time]);
    })
$("#date-slider")
    .slider({
        max: 2014,
        min: 1800,
        step: 1,
        slide: function(event, ui){
            time = ui.value - 1800;
            updateChart(data[time]);
        }
    })

function drawLegend(continents){
    continents.forEach(function(continent, i){
        let row = legend.append("g")
            .attr("transform", "translate(0, " + (i * 20) + ")");

        row.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", continentColor(continent));

        row.append("text")
            .attr("x", -10)
            .attr("y", 10)
            .attr("text-anchor", "end")
            .style("text-transform", "capitalize")
            .text(continent);
    })
}

function isNotNaN(num){
    return !isNaN(parseFloat(num));
}





// Load data and initialize the chart
d3.json("data/data.json").then(function(rawData){
    
    // Clean up data
    data = rawData.map(annualData => {

        let year = annualData.year,
            countries = annualData.countries.filter(country => {
                return isNotNaN(country.life_exp) && isNotNaN(country.income) && isNotNaN(country.population);
            });

        return {"year": year,
                "countries": countries           
                };
    })
    dataLength = data.length;

    // Compute scales
    let maxLifeExp = 0,
        maxIncome = 0,
        maxPopulation = 0,
        continents = {};
    data.forEach(annualData => {
        annualData.countries.forEach(country => {
            if (country.life_exp > maxLifeExp) maxLifeExp = country.life_exp;
            if (country.income > maxIncome) maxIncome = country.income;
            if (country.population > maxPopulation) maxPopulation = country.population;
            if (!continents[country.continent]) continents[country.continent] = true;
        })
    })
    y.domain([0, maxLifeExp]);
    x.domain([200, maxIncome]);
    area.domain([0, maxPopulation]);
    continentColor.domain(Object.keys(continents));

    // Draw scales
    chart.append("g")
        .attr("class", "y-axis")
        .call(yAxisCall);
    chart.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxisCall);

    drawLegend(Object.keys(continents));
  
    // Initial visualization run
    updateChart(data[0]);
    
})

function step(){
    // At the end of data, loop back
    time = (time < dataLength - 1) ? time + 1 : 0;
    updateChart(data[time]);
}

function updateChart(annualData){
        // Selected continent value
    let continent = $("#continent-select").val(),
        // Create individual transition object for each transition
        t = d3.transition().duration(timeInterval);
    
    // Update UI elements
    currentYearLabel.text(annualData.year);
    $("#year")[0].innerHTML = +(time + 1800);
    $("#date-slider").slider("value", +(time + 1800));


    // JOIN new data with old elements 
    chart.selectAll(".country")
        .data(annualData.countries, function(d){
            // Data JOIN tracks the items based on the country value instead of the array item index
            return d.country;
        })
        .join(
            // ENTER new elements present in data 
            enter => enter
                    .append("circle")
                    .attr("class", "country")
                    .attr("fill", d => continentColor(d.continent))
                    .attr("cy", d => y(d.life_exp))
                    .attr("cx", d => x(d.income))
                    .attr("r", 0)
                    .attr("opacity", 0)
                    .on("mouseover", tip.show)
                    .on("mouseout", tip.hide)
                .call(enter => enter.transition(t)
                    .attr("r", d => Math.sqrt(area(d.population)/ Math.PI))  
                    .attr("opacity", d => continent === "all" ? 1 : 
                                            d.continent === continent ? 1 : 0)
                ),
            // UPDATE old elements present in data
            update => update
                .call(update => update.transition(t)
                    .attr("cy", d => y(d.life_exp))
                    .attr("cx", d => x(d.income))
                    .attr("r", d => Math.sqrt(area(d.population)/ Math.PI))  
                    .attr("opacity", d => continent === "all" ? 1 : 
                                            d.continent === continent ? 1 : 0)
                ),
            // EXIT old elements
            exit => exit
                .call(exit => exit.transition(t)
                    .attr("opacity", 0)
                    .attr("r", 0)
                    .remove()
                )
        );
}
