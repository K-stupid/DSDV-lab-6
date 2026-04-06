const svg = d3.select("svg"),
      margin = {top: 20, right: 100, bottom: 50, left: 70},
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom;

const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select(".tooltip");

// Load data
d3.csv("https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv")
.then(data => {

    const selectedCountries = ["Vietnam", "US", "France", "Italy"];

    // Filter countries
    const filtered = data.filter(d => selectedCountries.includes(d["Country/Region"]));

    // Convert WIDE to LONG format
    let newData = [];

    filtered.forEach(d => {
        Object.keys(d).forEach(key => {
            if (key.match(/\d+\/\d+\/\d+/)) {
                newData.push({
                    country: d["Country/Region"],
                    date: d3.timeParse("%m/%d/%y")(key),
                    cases: +d[key]
                });
            }
        });
    });

    // Filter date range
    newData = newData.filter(d =>
        d.date >= new Date(2020, 3, 1) &&
        d.date <= new Date(2020, 4, 1)
    );

    // Group data
    const countries = d3.group(newData, d => d.country);

    const x = d3.scaleTime()
        .domain(d3.extent(newData, d => d.date))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(newData, d => d.cases)])
        .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.cases));

    // Draw lines
    countries.forEach((values, key) => {
        g.append("path")
            .datum(values)
            .attr("class", "line")
            .attr("stroke", color(key))
            .attr("d", line)
            .attr("id", key.replace(/\s/g, ''));
    });

    // Axes
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    g.append("g")
        .call(d3.axisLeft(y));

    // Tooltip
    svg.on("mousemove", function(event) {
        const [mx] = d3.pointer(event);

        let html = "";

        countries.forEach((values, key) => {
            const x0 = x.invert(mx - margin.left);
            const bisect = d3.bisector(d => d.date).left;
            const i = bisect(values, x0, 1);

            if (values[i]) {
                html += `${key}: ${values[i].cases}<br>`;
            }
        });

        tooltip.style("display", "block")
            .html(html)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
    });

    svg.on("mouseleave", () => tooltip.style("display", "none"));

    // Legend
    const legend = svg.selectAll(".legend")
        .data(countries.keys())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${width + 100}, ${20 + i * 20})`);

    legend.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d => color(d));

    legend.append("text")
        .attr("x", 15)
        .attr("y", 10)
        .text(d => d);

    // Highlight line on legend hover
    legend.on("mouseover", function(event, d) {
        d3.selectAll(".line").style("opacity", 0.1);
        d3.select("#" + d.replace(/\s/g, ''))
            .style("opacity", 1)
            .style("stroke-width", 4);
    });

    legend.on("mouseout", function() {
        d3.selectAll(".line")
            .style("opacity", 1)
            .style("stroke-width", 2);
    });

});