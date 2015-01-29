
define(function(require, exports, module) {
	var Engine     = require("famous/core/Engine");
	var Surface    = require("famous/core/Surface");
	var Transform  = require("famous/core/Transform");
	var Modifier   = require("famous/core/Modifier");
	var MouseSync  = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');	
    var StateModifier   = require("famous/modifiers/StateModifier");
    var RenderController = require("famous/views/RenderController");

    var Scrollview = require("famous/views/Scrollview");

	var PageFaultHandler = require('./PageFaultHandler');
	var mem_map = require('./mem_map');
	var kswapd = require('./kswapd');

	var LineCanvas = require('./LineCanvas');
	var BracketView = require('./BracketView');

	var Vector = require('./ProperVector');


	var MemoryPagingView = require('./MemoryPagingView');
	var MemoryBlockView = require('./MemoryBlockView');
	var PageTableView = require('./PageTableView');

	var DataClusterManager = require('./DataClusterManager');
	var ObjectFactory = require('./ObjectFactory');
	var PhysicsEngine   = require('famous/physics/PhysicsEngine');
	var Body            = require('famous/physics/bodies/Body');
	var Snap            = require('famous/physics/constraints/Snap');
	var HeaderFooterLayout = require('famous/views/HeaderFooterLayout');

	var process = require('./process');
	var Timer   = require('famous/utilities/Timer');


	var currentScene = 0;
    var objectFactory = new ObjectFactory();

	function init()
	{
		this.context = Engine.createContext(null);

		this.processes = {};
		this.memBlocks = {};

		this.lines = [];
		this.lineIndex = 0;

		var mainLayout = new HeaderFooterLayout({
			headerSize: 60,
			footerSize: 60
		});

		this.context.add(mainLayout);

		this.cameraModifier = new Modifier(
		{
			transform: function() {
				var m = Transform.rotate(Math.PI*(-1/6)*this.state.get(),Math.PI*(1/4)*this.state.get(),0);
				//noinspection JSCheckFunctionSignatures
                return Transform.aboutOrigin([300,300,0],m);
			}
		});
		this.cameraModifier.state = new Transitionable(0);


		this.mainNode = mainLayout.content.add(this.cameraModifier).add(new Modifier({transform: Transform.scale(1,1,1), align:[0.2,0.0]}));

		for (var i=0;i<60;i++)
		{
			var newLine = new LineCanvas();
			this.lines.push(newLine);
			this.mainNode.add(newLine.getModifier()).add(newLine);
		}

		this.scrollView = new Scrollview();
		this.scrollView.children = [];
		this.scrollView.sequenceFrom(this.scrollView.children);
		
		this.scrollView.removeChild = function(child){
			
			for (var i=0; i < this.children.length; i++)
			{
				if (this.children[i] == child)
					break;
			}			
			this.children.splice(i,1);
		};

		this.scrollView.removeAllChildren = function(){
			
			this.children.splice(0,this.children.length);
		};

		this.scrollView.addChild = function(child){
			child.parent = this;
			this.children.push(child);
		};

		mainLayout.content.add(new Modifier({transform: Transform.translate(20,0,0)})).add(this.scrollView);

        var nextButton = objectFactory.makeButtonView("Next");
        nextButton.setSize([undefined,undefined]);
        mainLayout.header.add(nextButton.modifier).add(nextButton);
        nextButton.on('click',function() {
            nextScene();
        });

		nextScene();
	}

	function nextScene()
	{
		scenes[currentScene++]();
	}

	function getProcess(name, processPosition, processRadius) {

		var newProcess;
		if (this.processes[name] == undefined)
		{
			newProcess = new process({position: processPosition, radius:processRadius});			
			this.mainNode.add(newProcess.getModifier()).add(newProcess);
			newProcess.createCallstack = createCallstack;
			this.processes[name] = newProcess;			
		}
		else
		{
			newProcess = this.processes[name];

			if (processPosition)
				newProcess.setPosition(processPosition,600);

			if (processRadius)
				newProcess.setRadius(processRadius);
		}
		return newProcess;
	} 

	function getMemoryBlock(name,blockPosition,memSize,startAddress,pageOnly) {

		if (startAddress == undefined)
			startAddress = 0;

        if (pageOnly == undefined)
            pageOnly = false;

		var memBlock;
		if (this.memBlocks[name] == undefined)
		{
			memBlock = new MemoryBlockView({position:blockPosition,startAddress:startAddress,memSize:memSize,responsive:false, isPageOnly:pageOnly});
			this.memBlocks[name] = memBlock;
			this.mainNode.add(memBlock.getModifier()).add(memBlock);
		}
		else
		{			
			memBlock = this.memBlocks[name];
			memBlock.setPosition(blockPosition,1000);
			memBlock.setMemSize(memSize);
		}
		return memBlock;
	}

	function showText(text,position)
	{
		var textSurface = objectFactory.makeSurface(text,'outline');

		textSurface.renderController = new RenderController();
		textSurface.renderController.show(textSurface);

		textSurface.setSize([200,80]);
		textSurface.modifier = new StateModifier({
			transform: Transform.translate(position[0],position[1],position[2])
		});

		this.mainNode.add(textSurface.modifier).add(textSurface.renderController);
		

		return textSurface;
	}

	function makeButton(text, position)
	{		
		var button = objectFactory.makeButtonView(text);
		button.setSize([160,50]);

		if (position != undefined)
		{
			button.modifier.opacityState = new Transitionable(0.8);
			button.modifier = new Modifier({
				opacity: function() {return this.opacityState.get();},
				transform: Transform.translate(position[0],position[1],position[2])
			});		
		}

		if (position == undefined)
		{
			var wrappingView = new View();
			button.size = [160,50];
			button.getSize = function (){return [160,50];};
			wrappingView.add(button.modifier).add(button);
			this.scrollView.addChild(wrappingView);

			button.hide = function() {
                this.scrollView.removeChild(wrappingView);
            }.bind(this);
		}

		return button;
	}

	function drawLine(fromPoint,toPoint) {
		// console.log(lineIndex + '=' + fromPoint + '-->' + toPoint);
		this.lines[this.lineIndex].setLinePoints(fromPoint,toPoint);
	 	this.lineIndex = (this.lineIndex+1)%this.lines.length;
	}

	function createCallstack () {

		var callstack = [];
		callstack.push = function (){
		    for( var i = 0, l = arguments.length; i < l; i++ )
		    {
		        this[this.length] = arguments[i];
		        console.log(this[this.length-2],this[this.length-1]);
		        if (this.length >= 2)
		        {
		        	drawLine(this[this.length-2],this[this.length-1]);
		        }
		    }
		    return this.length;
		};

		return callstack;
	};

	function setCameraState(cameraMode)
	{
        var transition = {duration:500, curve: Easing.inOutQuad};
		if (cameraMode == "2D")
		{
			//noinspection JSCheckFunctionSignatures
            this.cameraModifier.state.set(0,transition);
		}
		else
		{
            //noinspection JSCheckFunctionSignatures
			this.cameraModifier.state.set(1,transition);
		}
	}

	var labelAngles = [
		-Math.PI/4,
		Math.PI/4
	];

	function label(object,text,labelIndex)
	{
		if (labelIndex == undefined)
			labelIndex = 0;

		var angle = labelAngles[labelIndex];
		
		var labelSurface = objectFactory.makeLabelSurface(text);
		objectFactory.makePositionable(labelSurface);
		labelSurface.renderController = new RenderController();
		labelSurface.renderController.show(labelSurface);

		if (object.labels == undefined || object.labels[labelIndex] == undefined)
		{
			var labelLine = new LineCanvas({opacityRange:[1,1]});


            var updatePosition;
            updatePosition = function () {
                var objectPos = Vector.fromArray(object.calculatePosition());
                var objectSize = Vector.fromArray(object.calculateSize());
                var labelPos = objectPos.add(new Vector(objectSize.x, 0, 0));
                var offset = (Vector.fromAngles(0, angle).multiply(80));
                labelPos = labelPos.add(offset);
                labelSurface.setPosition(labelPos.toArray());
            };
			
			updatePosition();

			this.mainNode.add(labelLine.getModifier()).add(labelLine);
			var node = this.mainNode.add(labelSurface.modifier);
			node.add(labelSurface.renderController);

			labelLine.setLineObjects(object,labelSurface);

			object.on('positionChange',function(){
				updatePosition();
				labelLine.update();
			});

			object.labels = [];
			object.labels[labelIndex] = [labelSurface];
		}
		else
		{
			var labelViews = object.labels[labelIndex];
			var lastView = labelViews[labelViews.length-1];

			updatePosition = function(){
				var objectPos = Vector.fromArray(lastView.calculatePosition());
				var objectSize = Vector.fromArray(lastView.getSize());
				var labelPos = objectPos.add(new Vector(0,objectSize.y,0));
				labelSurface.setPosition(labelPos.toArray());
			};

			updatePosition();
			object.on('positionChange',function(){
				updatePosition();
			});

			node = this.mainNode.add(labelSurface.modifier);
			node.add(labelSurface);
			labelSurface.setMaxSize([100,true]);
			labelViews.push(labelSurface);
		}
		labelSurface.setMaxSize([400,0]);
	}


    function say(text)
    {
        var textSurface = objectFactory.makeSurface(text,'blank');

        textSurface.setSize([300,true]);
        textSurface.pipe(this.scrollView);
        this.scrollView.addChild(textSurface);
    }


	
	var scenes = 
	[
		function()
		{
			say("Let's explore how the Linux Kernel manages memory!");
			say("How does it protect processes from writing to memory they aren't supposed to?");
			say("What happens when the system runs out of room for all running processes?");
			say("How does the system decide what processes get what memory?");
			say("Let's begin by illustrating a simple memory manager...");


		},
		function()
		{
			setCameraState("2D");

			var memory = getMemoryBlock("block1", [100,100],16);
			label(memory,"This is a 16 byte block of memory.");
		},
		//Introduce concept of pages
		function()
		{
			var memory = getMemoryBlock("block1", [100,100],16);

			label(memory,"Memory is often shown in terms of bytes, but memory management works in <b>pages</b>",0);
		},
		//Add a bunch of pages
		function()
		{
			var memories = [
				getMemoryBlock("block1", [300,60],16,0),
				getMemoryBlock("block2", [300,360],16,16),
				getMemoryBlock("block3", [300,660],16,32)];

			label(memories[1],"A page is a set amount of memory. In our simulated system, it's 16 bytes.");
			Timer.setTimeout(function(){label(memories[1],"Most modern computers use 4kB pages",0)},200);
		},
		//Add some processes
		function()
		{
			var p1 = getProcess("1",[100,200],40);

			label(p1,"This is a process.");
		},
		function()
		{
			var p1 = getProcess("1");

			label(p1,"Processes generally use a large number of pages.");
		},		
		function()
		{
			var p1 = getProcess("1");
			p1.allocateMem(0,47);
			p1.start();

			var memories = [
				getMemoryBlock("block1", [400,60],16),
				getMemoryBlock("block2", [400,360],16),
				getMemoryBlock("block3", [400,660],16)];

			p1.pipe(memories[0]);
			p1.pipe(memories[1]);
			p1.pipe(memories[2]);
		},
        function()
        {
            say("Let's zoom out on this system.");

            for (var i=0;i<48;i++)
            {
                var block =  getMemoryBlock("block"+i, [600, 20+(i*20)], 16,16*i,true);
                block.setPageOnly(true);
                block.setSize([60,18]);
            }
        },
        function()
        {
            say("Now let's add more processes");


        }

        //,
		// function()
		// {
		// 	return; 

		// 	showText(strings.scene4.line1);
		// 	showText(strings.scene4.line2);
		// 	showText(strings.scene5.intro);
		
		// 	var userProcesses = [
		// 		getProcess("1",[0,0],40),
		// 		getProcess("2",[500,400],40),
		// 		getProcess("3",[0,700],40)
		// 	];


		// 	userProcesses[0].allocateMem(0,12);
		// 	userProcesses[1].allocateMem(13,20);
		// 	userProcesses[2].allocateMem(20,31);

		// 	var block1 = getMemoryBlock("block1",[250,0],32,0);

		// 	for (var i=0;i<userProcesses.length;i++)
		// 	{
		// 		block1.subscribe(userProcesses[i]);
		// 		userProcesses[i].start();		
		// 	}
		// 	var nextButton = makeButton("Next");
		// 	nextButton.on('click',function(){
		// 		showText("");			
		// 		scrollView.removeAllChildren();	
		// 		scene5();
		// 	});
		// }
	];

	var scene5 = {
		"intro" : "But what keeps one process from writing into the memory of another process?",
		"demo1" : "This is a simulation of processes randomly writing to memory",
		"demo2" : "There are three processes (1,2,3) and a 32 byte block of memory",
		"demo3" : "Each process has a designated space it can write to"
	};

	function scene5()
	{
		setCameraState("2D");

		showText(strings.scene5.demo1);
		showText(strings.scene5.demo2);
		showText(strings.scene5.demo3);

		var userProcesses = [
			getProcess("1",[0,0],40),
			getProcess("2",[0,400],40),
			getProcess("3",[0,700],40)
		];

		var block1 = getMemoryBlock("block1",[250,0],32,0);

		userProcesses[0].stop();
		userProcesses[1].stop();
		userProcesses[2].stop();


		var bracket1 = new BracketView({size: [100,100]});
		bracket1.setBracketObjects(block1.cells[0],block1.cells[12]);
		bracket1.setRootObject(userProcesses[0]);
		this.mainNode.add(bracket1.getModifier()).add(bracket1);

		var bracket2 = new BracketView({size: [100,100]});
		bracket2.setBracketObjects(block1.cells[13],block1.cells[20]);
		bracket2.setRootObject(userProcesses[1]);
		this.mainNode.add(bracket2.getModifier()).add(bracket2);

		var bracket3= new BracketView({size: [100,100]});
		bracket3.setBracketObjects(block1.cells[20],block1.cells[31]);
		bracket3.setRootObject(userProcesses[2]);
		this.mainNode.add(bracket3.getModifier()).add(bracket3);

		var nextButton = makeButton("Next");
		nextButton.on('click',function(){
			this.parent.removeAllChildren();	
			scene6();
		});
		

	}

	init();
});
























