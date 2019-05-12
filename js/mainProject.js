// Construct a canvas 
var margin = {top: 100, right: 10, bottom: 75, left: 75},
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom

var svg = d3.select("#chart-area")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")

// Add chart title
g.append("text")
    .attr("class", "x axis-label")
    .attr("x", width/2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .text("D3 chart: Relationship between income and life expectancy")

// Add axes labels
g.append("text")
    .attr("class", "y axis-label")
    .attr("x", -height/2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .attr("transform","rotate(-90)")
    .text("Life Expectancy (years)")

g.append("text")
    .attr("class", "x axis-label")
    .attr("x", width/2)
    .attr("y", height + 50)
    .attr("text-anchor", "middle")
    .attr("font-size", 18)
    .text("GDP Per Capita")

// Add current year
var current_year_text = g.append("text")
    .attr("class", "current-year")
    .attr("x", width)
    .attr("y", height - 10)
    .attr("text-anchor", "end")
    .attr("font-size", 40)
    .attr("fill", "gray")

// Define scales
var y = d3.scaleLinear()
var x = d3.scaleLog()
var area = d3.scaleLinear()
var continent = d3.scaleOrdinal()

// Animation time interval
var timeInterval = 100

// Tooltip
var tip = d3.tip().attr('class', 'd3-tip')
    .html(function(d) {
        var text = "<strong>Country:</strong> <span style='color:red'>" + d.country + "</span><br>";
        text += "<strong>Continent:</strong> <span style='color:red;text-transform:capitalize'>" + d.continent + "</span><br>";
        text += "<strong>Life Expectancy:</strong> <span style='color:red'>" + d3.format(".2f")(d.life_exp) + "</span><br>";
        text += "<strong>GDP Per Capita:</strong> <span style='color:red'>" + d3.format("$,.0f")(d.income) + "</span><br>";
        text += "<strong>Population:</strong> <span style='color:red'>" + d3.format(",.0f")(d.population) + "</span><br>";
        return text;
    });
g.call(tip);





// Load and process data
d3.json("data/data.json").then(function(data){

	// console.log(data)
	// // First year data 
    // console.log(data[0].countries)


    
    // Filter data
    dataFiltered = []
    for (var yearIdx=0; yearIdx < data.length; yearIdx++){
        var dataCurrentYear = {year: data[yearIdx].year, countries: []}
        for (var countryIdx=0; countryIdx < data[yearIdx].countries.length; countryIdx++){
            var d = data[yearIdx].countries[countryIdx]
            if ( !isNaN(parseFloat(d.life_exp)) && !isNaN(parseFloat(d.income)) && !isNaN(parseFloat(d.population)) ){
                dataCurrentYear.countries.push(d)
            } 
        }
        dataFiltered.push(dataCurrentYear)
    }



    // Compute scales
    y
        .domain([0, 90])
        // .domain([0, d3.max(dataFiltered, dataThisYear => 
        //                    d3.max(dataThisYear.countries, d => d.life_exp))])
        .range([height, 0])
    x
        .domain([200, d3.max(dataFiltered, dataThisYear => 
                           d3.max(dataThisYear.countries, d => d.income))])
        .range([0, width])
        .base(10)
    area
        .domain([0, d3.max(dataFiltered, dataThisYear => 
                           d3.max(dataThisYear.countries, d => d.population))])
        .range([70, 3000])
        var continents = ["europe", "asia", "americas", "africa"]
    continent
        .domain(continents)
        .range(d3.schemeCategory10)



    // Add legend
    var legend = g.append("g")
        .attr("transform", "translate(" + (width - 10) + "," + (height - 125) + ")")
    
    continents.forEach(function(continentCurrent, i){
        var legendRow = legend.append("g")
            .attr("transform", "translate(0, " + (i * 20) + ")")

        legendRow.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", continent(continentCurrent))

        legendRow.append("text")
            .attr("x", -10)
            .attr("y", 10)
            .attr("text-anchor", "end")
            .style("text-transform", "capitalize")
            .text(continentCurrent)       
    })

       

    // Add scales
    var yAxisCall= d3.axisLeft(y)
    g.append("g")
        .attr("class", "y-axis")
        .call(yAxisCall)

    var xAxisCall = d3.axisBottom(x)
        .ticks(3)
        .tickValues([400, 4000, 40000])
        .tickFormat(d => "$" + d)
    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxisCall)
 


    // Update figure repeatedly
    var max_iter = dataFiltered.length
    var count = 0

    d3.interval(function(){
    // for (var i = 0; i < max_iter; i++ ){
        if (count < max_iter){
            updateFigure(dataFiltered[count])
            count ++
        } else {
            count = 0  
        }
    // }
    }, timeInterval)

    // Run of the first visualization
    updateFigure(dataFiltered[0])
})





function updateFigure(dataObject){
    // Create separate transition object for each transition
    var t = d3.transition().duration(timeInterval)

    var data = dataObject.countries
    var current_year = dataObject.year
    current_year_text
        .text(current_year)



    // JOIN new data with old elements 
    var circles = g.selectAll("circle")
        .data(data, function(d){
            // Data JOIN tracks the items based on the country value instead of the item index in the array
            return d.country
        })

    // EXIT old elements
    circles.exit()
        .transition(t)
        .attr("r", 0)
        .remove()
    
    // UPDATE old elements present in new data
    circles
        .transition(t)
        .attr("cy", d => y(d.life_exp))
        .attr("cx", d => x(d.income))
        .attr("r", d => Math.sqrt(area(d.population)) / Math.PI)

    // ENTER new elements presented in new data 
    circles.enter()
        .append("circle")
        .attr("fill", d => continent(d.continent))
        .attr("cy", d => y(d.life_exp))
        .attr("cx", d => x(d.income))
        .attr("r", 0)
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide)
        // AND UPDATE old elements present in new data
        // in this case, circles represents UPDATE selection
        .merge(circles)
        .transition(t)
            .attr("r", d => Math.sqrt(area(d.population)/ Math.PI))  
}
