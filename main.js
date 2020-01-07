
const width = 800
const height = 600
const margin = ({top: 20, right: 0, bottom: 145, left: 50})

const parseTime = d3.timeParse("%d-%b-%y")
const formatTime = d3.timeFormat("%b %d")

const data = d3.tsv("data.tsv", function(d, i) {
  d.date = parseTime(d.date);
  d.score = isNaN(+d.score) ? d.score : +d.score;
  d.i = i
  return d;
}).then(data => {

  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height]);

  const x = d3.scaleBand()
    .domain(d3.range(data.length))
    .range([margin.left, width - margin.right])
    .padding(0.1)
    
  const y = d3.scaleLinear()
    .domain([-50, 100])
    .range([height - margin.bottom, margin.top])

  const xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom + 70})`)
    .call(d3.axisBottom(x).tickFormat(i => formatTime(data[i].date)).ticks(data.length))

  const yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.select(".domain").remove())
      .call(g => g.select(".tick:last-of-type text").clone()
          .attr("x", 3)
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text(data.y))

  // WIN with score +123
  svg.append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    	.filter(d => typeof d.score === 'number' && d.score > 0)
    	.attr("x", d => x(d.i))
    	.attr("y", d => y(d.score))
    	.attr("fill", '#00ff00')
    	.attr("height", d => y(0) - y(Math.abs(d.score)))
    	.attr("width", x.bandwidth())

  // WIN without score
  svg.append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    	.filter(d => d.score === "WIN")
    	.attr("x", d => x(d.i))
    	.attr("y", d => y(20))
    	.attr("fill", '#00000000')
    	.attr("stroke", '#00ff00')
    	.attr("stroke-dasharray", 4)
    	.attr("height", y(0) - y(20))
    	.attr("width", x.bandwidth())

  // LOSS with score +123
  svg.append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    	.filter(d => typeof d.score === 'number' && d.score < 0)
    	.attr("x", d => x(d.i))
    	.attr("y", y(0))
    	.attr("fill", 'red')
    	.attr("height", d => y(0) - y(Math.abs(d.score)))
    	.attr("width", x.bandwidth())

  // LOSS without score DNF
  svg.append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    	.filter(d => d.score === "LOSS")
    	.attr("x", d => x(d.i))
    	.attr("y", d => y(0))
    	.attr("fill", '#00000000')
    	.attr("stroke", 'red')
    	.attr("stroke-dasharray", 4)
    	.attr("height", y(0) - y(20))
    	.attr("width", x.bandwidth())

  svg.append("g")
    .selectAll("text")
    .data(data)
    .enter()
    .append("text")
    .filter(d => d.score === "LOSS")
    .text("DNF")
  	.style("text-anchor", "middle")
  	.attr("font-size", "8px")
    .attr("y", y(-12))
    .attr("x", d => x(d.i) + 13)
    .attr("fill", "red")

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom + 20})`)
    .selectAll("g")
    .data(data)
    .join("image")
      .attr("x", (d, i) => x(i) + 4)
      .attr("href", d => d.game === 'vanilla' ? 'xcom.png' : 'exalt-logo.png')
      .attr("width", "20")
      .attr("height", "20")

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom + 60})`)
    .selectAll("g")
    .data(data)
    .join("text")
      .attr("x", (d, i) => x(i) + x.bandwidth() / 2)
      .attr("fill", d => d.group === '👤' ? '#ef14ef' : 'white')
      .style("text-anchor", "middle")
      .text(d => d.group)

  svg.append("g")
    	.call(xAxis)
    	.selectAll("text")
    	.attr("transform", "rotate(90)")
    	.style("text-anchor", "start")
    	.attr("y", -4)
    	.attr("x", 10);

  svg.append("g")
      .call(yAxis);

svg.append("text")
      .attr("y", 10)
      .attr("x", 80)
      .attr("dy", "1em")
      .attr("font-size", "35px")
      .style("text-anchor", "left")
      .text("XCOM Score Card");  

svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 5)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Score");  

svg.append("text")
      .attr("y", 570)
      .attr("x", (width / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Date");  

  d3.select('#container').append(() => svg.node())
})
