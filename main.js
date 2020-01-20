
const margin = ({top: 20, right: 20, bottom: 200, left: 50})
const width = 800 - margin.left - margin.right
const height = 600 - margin.top - margin.bottom

const parseTime = d3.timeParse("%d-%b-%y")
const formatTime = d3.timeFormat("%b %d")

let showVanilla = true,
  showEvolution = true,
  showCargo = true,
  showTog = true

const svg = initGraph()

function parseData(d, i) {
  d.date = parseTime(d.date);
  d.score = isNaN(+d.score) ? d.score : +d.score;
  d.i = i
  return d;
}

function initGraph() {

  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom])

  d3.select('#graph-container').append(() => svg.node())

  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(${margin.left},${height + 130})`)

  svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},${margin.top})`)
      
  const content = svg.append("g")
    .attr("class", "conent")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    
  render()

  return svg
}

function render() {
  d3.tsv("data.tsv", parseData).then(renderGraph)
}

const isVanilla = d => d.game === "vanilla"
const isEvolution = d => !isVanilla(d)    

function renderGraph(_data) {

  const data = _data.filter(x => {
    if (!showVanilla && isVanilla(x)) {
      return false
    }
    return true
  })

  const missions = [
    "Onslaugt",
    "Occupation",
    "Infiltration",
    "Misdirection",
    "Domination",
    "Supression",
    "Annihilation"
  ].map(mission => {

    const sum = (acc, curr) => acc + curr
    const currentMission = d => d.mission === mission

    const currentMissionEvolutionOnly = data.filter(isEvolution).filter(currentMission)

    const scores = currentMissionEvolutionOnly.filter(d => !isNaN(+d.score)).map(d => d.score)

    const played = currentMissionEvolutionOnly
    
    const wins = currentMissionEvolutionOnly.filter(d => (!isNaN(+d.score) && d.score > 0) || d.score === "WIN")
      
    const losses = currentMissionEvolutionOnly.filter(d => (!isNaN(+d.score) && d.score < 0) || d.score === "LOSS")
    
    document.getElementById(`${mission.toLowerCase()}-average`).innerHTML = scores.length === 0 ? "-" : scores.reduce(sum, 0) / scores.length
    document.getElementById(`${mission.toLowerCase()}-ratio`).innerHTML = played.length === 0 ? "-" : `${Math.round((wins.length / played.length) * 100)} %`
    document.getElementById(`${mission.toLowerCase()}-amount`).innerHTML = played.length === 0 ? "-" : played.length
  })

  const x = d3.scaleBand()
    .domain(d3.range(data.length))
    .range([0, width])
    .padding(0.2)
    .paddingOuter(0)

  const scores = data.filter(x=>!isNaN(x.score)).map(x=>x.score)

  const y = d3.scaleLinear()
    .domain([d3.min(scores), 100])
    .range([height + 30, margin.top])

  svg.select(".x-axis")
      .call(d3.axisBottom(x).tickFormat(i => formatTime(data[i].date)).ticks(data.length))
      .selectAll("text")
      .attr("transform", "rotate(90)")
      .style("text-anchor", "start")
      .attr("y", -4)
      .attr("x", 10);

  svg.select(".y-axis")
    .call(d3.axisLeft(y))

  const selection = svg.select(".conent")
    .selectAll("rect")
    .data(data, x=>`${x.i}`)
    .join("rect")

  // WIN with score +123
  selection.filter(d => typeof d.score === 'number' && d.score > 0)
      .attr("x", d => x(d.i))
      .attr("y", d => y(d.score))
      .attr("fill", '#00ff00')
      .attr("height", d => y(0) - y(Math.abs(d.score)))
      .attr("width", x.bandwidth())

  // WIN without score
  selection.filter(d => d.score === "WIN")
      .attr("x", d => x(d.i))
      .attr("y", d => y(20))
      .attr("fill", '#00000000')
      .attr("stroke", '#00ff00')
      .attr("stroke-dasharray", 4)
      .attr("height", y(0) - y(20))
      .attr("width", x.bandwidth())

  // LOSS with score +123
  selection.filter(d => typeof d.score === 'number' && d.score < 0)
      .attr("x", d => x(d.i))
      .attr("y", y(0))
      .attr("fill", 'red')
      .attr("height", d => y(0) - y(Math.abs(d.score)))
      .attr("width", x.bandwidth())

  // LOSS without score DNF
  selection.filter(d => d.score === "LOSS")
      .attr("x", d => x(d.i))
      .attr("y", d => y(0))
      .attr("fill", '#00000000')
      .attr("stroke", 'red')
      .attr("stroke-dasharray", 4)
      .attr("height", y(0) - y(20))
      .attr("width", x.bandwidth())

  svg.select(".conent")
    .selectAll("text")
    .data(data, x=>`${x.i}`)
      .join("text")
      .filter(d => d.score === "LOSS")
      .text("DNF")
      .style("text-anchor", "middle")
      .attr("font-size", "5px")
      .attr("y", y(-12))
      .attr("x", d => x(d.i) + 7)
      .attr("fill", "red")
    
  svg.select(".conent")
    .selectAll("image")
    .data(data, x=>`${x.i}`)
    .join("image")
      .attr("x", (d, i) => x(i))
      .attr("y", (d, i) => y(d3.min(scores) - 20))
      .attr("href", d => d.game === 'vanilla' ? 'xcom.png' : 'exalt-logo.png')
      .attr("width", "20")
      .attr("height", "20")

  svg.select(".conent")
    .selectAll(".player-icons")
    .data(data, x=>`${x.i}`)
    .join("text")
      .attr("class", "player-icons")
      .attr("x", (d, i) => x(i) + (x.bandwidth() / 2) + 2)
      .attr("y", (d, i) => y(d3.min(scores) - 15))
      .attr("fill", d => d.group === '👤' ? '#ef14ef' : 'white')
      .style("text-anchor", "middle")
      .text(d => d.group)
  
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
}