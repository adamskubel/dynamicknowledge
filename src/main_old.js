
define(function(require, exports, module) {
	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var PageFaultHandler = require('./PageFaultHandler');
	var mem_map = require('./mem_map');
	var kswapd = require('./kswapd');

	var LineCanvas = require('./LineCanvas');
	var MemoryPagingView = require('./MemoryPagingView');
	var MemoryBlockView = require('./MemoryBlockView');
	var PageTableView = require('./PageTableView');

	var DataClusterManager = require('./DataClusterManager');
	var ObjectFactory = require('./ObjectFactory');

	var process = require('./process');
	
	var lines = [];
	var lineIndex = 0;
	for (var i=0;i<10;i++)
	{
		lines.push(new LineCanvas());
	}

	var factory = new ObjectFactory();


	var dataObjects = [];
	for (var i=0;i<16;i++)
	{
		var surface = factory.makeSurface(''); //0x' + i.toString(16));
		surface.containerAddress = i;
		surface.containerName = 'swap';

		// surface.on('mouseenter',function(event){

		// 	if (this.containerName == 'mem')
		// 		this.setContainer('swap',this.containerAddress);
		// 	else
		// 		this.setContainer('mem',this.containerAddress);
		// });
		dataObjects.push(surface);
	}

	var userProcess1 = new process({position: [100,100], radius:80});
	
	var block1 = new MemoryBlockView({position:[100, 150],size:[150,400],startAddress:0x0,memSize:16,responsive:true});
	var block2 = new MemoryPagingView({position:[260, 150],size:[150,400],startAddress:0x0,memSize:16});

	var pageTable = new PageTableView({position:[500, 200],size:[300,200],startAddress:0x0,memSize:16});

	var physicalMemory = new mem_map({position:[900, 200],size:[150,400],startAddress:0x0,memSize:16});

	var pageFaultHandler = new PageFaultHandler({position:[500,500],size:[100,100]},dataObjects,physicalMemory);
	var diskBlock = new MemoryBlockView({position:[1100, 20],size:[80,440],startAddress:0x0,memSize:32,responsive:false});	

	var swapDaemon = new kswapd({position:[1100,600],size:[100,100]},physicalMemory,diskBlock,dataObjects,pageTable);


	block2.subscribe(block1);
	pageTable.subscribe(block2);
	physicalMemory.subscribe(pageTable);

	pageFaultHandler.subscribe(pageTable);

	this.lineIndex = 0;

	function drawLine(fromPoint,toPoint) {
		console.log(lineIndex + '=' + fromPoint + '-->' + toPoint);
		lines[lineIndex].setLinePoints(fromPoint,toPoint);	
	 	lineIndex = (lineIndex+1)%10;
	}

	block1.createCallstack = function (){

		// console.log('----');
		var callstack = [];

		for (var i=0;i<lines.length; i++)
		{
			lines[i].clear();
		}
		lineIndex = 0;

		callstack.push2 = function (){
		    for( var i = 0, l = arguments.length; i < l; i++ )
		    {
		        this[this.length] = arguments[i];
		        
		        if (this.length >= 2)
		        {
		        	drawLine(this[this.length-2],this[this.length-1]);
		        }
		    }
		    return this.length;
		};

		return callstack;
	};

	var mainContext = Engine.createContext();	
	
	for (var i=0;i<10;i++)
	{
		mainContext.add(lines[i].getModifier()).add(lines[i]);
	}

	var dcm = new DataClusterManager({},mainContext);


	dcm.addContainerCluster('swap',diskBlock.cells);
	dcm.addContainerCluster('mem',physicalMemory.cells);
	dcm.addDataCluster(dataObjects);

	mainContext.add(diskBlock.getModifier()).add(diskBlock);
	// mainContext.add(memoryBlock.getModifier()).add(memoryBlock);


	mainContext.add(userProcess1.getModifier()).add(userProcess1);
	// mainContext.add(block1.getModifier()).add(block1);
	mainContext.add(block2.getModifier()).add(block2);
	mainContext.add(pageTable.getModifier()).add(pageTable);
	mainContext.add(physicalMemory.getModifier()).add(physicalMemory);
	mainContext.add(pageFaultHandler.getModifier()).add(pageFaultHandler);
	mainContext.add(swapDaemon.getModifier()).add(swapDaemon);
});
























