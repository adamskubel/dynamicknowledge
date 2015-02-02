define(function (require, exports, module)
{
	var Engine = require("famous/core/Engine");
	var Surface = require("famous/core/Surface");
	var Transform = require("famous/core/Transform");
	var Modifier = require("famous/core/Modifier");
	var MouseSync = require("famous/inputs/MouseSync");
	var View = require('famous/core/View');
	var Transitionable = require('famous/transitions/Transitionable');
	var Easing = require('famous/transitions/Easing');
	var StateModifier = require("famous/modifiers/StateModifier");
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
    var MemorySystemView = require('./MemorySystemView');

	var DataClusterManager = require('./DataClusterManager');
	var ObjectFactory = require('./ObjectFactory');
	var PhysicsEngine = require('famous/physics/PhysicsEngine');
	var Body = require('famous/physics/bodies/Body');
	var Snap = require('famous/physics/constraints/Snap');
	var HeaderFooterLayout = require('famous/views/HeaderFooterLayout');
	var FlexibleLayout = require('famous/views/FlexibleLayout');
	var SequentialLayout = require('famous/views/SequentialLayout');

    var StretchyLayout = require('./PositioningLayouts/StretchyLayout');
    var PositionableView = require('./PositioningLayouts/PositionableView');

	var process = require('./process');
	var Timer = require('famous/utilities/Timer');


	var currentScene = 0;
	var objectFactory = new ObjectFactory();

	var memoryConfig = {
		pageSize: 16
	};

    var rootNode;

	function init()
	{
		this.context = Engine.createContext(null);

		this.processes = {};
		this.pages = {};

		this.lines = [];
		this.lineIndex = 0;

		var mainLayout = new SequentialLayout({direction:0});
		var mainChildren = [];
		mainLayout.sequenceFrom(mainChildren);

		this.context.add(mainLayout);

		this.cameraModifier = new Modifier(
			{
				transform: function ()
				{
					var m = Transform.rotate(Math.PI * (-1 / 6) * this.state.get(), Math.PI * (1 / 4) * this.state.get(), 0);
					//noinspection JSCheckFunctionSignatures
					return m;//Transform.aboutOrigin([-500, 0, 0], m);
				}
			});
		this.cameraModifier.state = new Transitionable(0);


		var mainView = new View();
		this.mainNode = mainView.add(new Modifier({
			align: [0.5,0.5],
			origin: [0.5,0.5]
		})).add(this.cameraModifier);


		//this.mainNode.add(objectFactory.makeSurface("",'outline'));

		for (var i = 0; i < 60; i++)
		{
			var newLine = new LineCanvas();
			this.lines.push(newLine);
			this.mainNode.add(newLine.getModifier()).add(newLine);
		}

		this.scrollView = makeScrollview();
		var scrollWrapperView = new View();
		scrollWrapperView.add(this.scrollView.modifier).add(this.scrollView);

		mainChildren.push(mainView);

		var padding1 = objectFactory.makeSurface("",'blank');
		padding1.setSize([30,undefined]);
		mainChildren.push(padding1);

		mainChildren.push(scrollWrapperView);
		var padding2 = objectFactory.makeSurface("",'blank');
		padding2.setSize([30,undefined]);
		mainChildren.push(padding2);

		var nextButton = objectFactory.makeButtonView("Next");
		nextButton.setSize([300, 100]);
		var wrappingView = new View();
		wrappingView.add(nextButton.modifier).add(nextButton);
		this.scrollView.addChild(wrappingView);

        rootNode = this.mainNode;

		nextButton.on('click', function (){
            nextScene.call(this);
        }.bind(this));

		nextScene.call(this);
		nextScene.call(this);
	}

	var scenes = [
		function ()
		{
			setCameraState("2D");

			say("Let's explore how the Linux Kernel manages memory!");
			say("How does it protect processes from writing to memory they aren't supposed to?");
			say("What happens when the system runs out of room for all running processes?");
			say("How does the system decide what processes get what memory?");
		},
		function ()
		{
			var pages = getPages(0,16,[300,-200],true);

			var processes = [
				getProcess("1",[-300,100],40),
				getProcess("2",[-260,200],60),
				getProcess("3",[-320,-100],80)
			];

            var memorySystem = new MemorySystemView({
                processes:processes,
                size: [200,300],
                position: [0,0,0]
            });
            rootNode.add(memorySystem.getModifier()).add(memorySystem);
		},
		function()
		{
			setCameraState("3D");
		},
		function()
		{
			setCameraState("2D");
		}
	];

	function nextScene()
	{
		scenes[currentScene++]();
	}

	function getProcess(name, processPosition, processRadius)
	{

		var newProcess;
		if (this.processes[name] == undefined)
		{
			newProcess = new process({position: processPosition, radius: processRadius, name: name});
			this.mainNode.add(newProcess.getModifier()).add(newProcess);
			newProcess.createCallstack = createCallstack;
			this.processes[name] = newProcess;
		}
		else
		{
			newProcess = this.processes[name];

			if (processPosition)
			{
				newProcess.setPosition(processPosition, 600);
			}

			if (processRadius)
			{
				newProcess.setRadius(processRadius);
			}
		}
		return newProcess;
	}

	function getPage(pageNum, blockPosition, pageOnly)
	{
		var startAddress = pageNum * memoryConfig.pageSize;

		if (pageOnly == undefined)
		{
			pageOnly = false;
		}

		var memBlock;
		if (this.pages[pageNum] == undefined)
		{
			memBlock = new MemoryBlockView(
				{
					position: blockPosition,
					startAddress: startAddress,
					memSize: memoryConfig.pageSize,
					responsive: false,
					isPageOnly: pageOnly
				});

			this.pages[pageNum] = memBlock;
			this.mainNode.add(memBlock.getModifier()).add(memBlock);

		} else
		{
			memBlock = this.pages[pageNum];
			memBlock.setPosition(blockPosition);
		}
		return memBlock;
	}

	function getPages(startNum, pageCount, startPosition,pageOnly)
	{
		var pages = [];
		for (var x= 0, i=startNum;i<(startNum+pageCount);i++)
		{
			x += 22;
			var position = [startPosition[0], startPosition[1]+(x)];
			var block =  getPage(i,position,pageOnly);
			block.setSize([60,18]);
		}
		return pages;
	}


	function showText(text, position)
	{
		var textSurface = objectFactory.makeSurface(text, 'outline');

		textSurface.renderController = new RenderController();
		textSurface.renderController.show(textSurface);

		textSurface.setSize([200, 80]);
		textSurface.modifier = new StateModifier({
			transform: Transform.translate(position[0], position[1], position[2])
		});

		this.mainNode.add(textSurface.modifier).add(textSurface.renderController);


		return textSurface;
	}

	function makeButton(text, position)
	{
		var button = objectFactory.makeButtonView(text);
		button.setSize([160, 50]);

		if (position != undefined)
		{
			button.modifier.opacityState = new Transitionable(0.8);
			button.modifier = new Modifier({
				opacity: function ()
				{
					return this.opacityState.get();
				},
				transform: Transform.translate(position[0], position[1], position[2])
			});
		}

		if (position == undefined)
		{
			var wrappingView = new View();
			button.size = [160, 50];
			button.getSize = function ()
			{
				return [160, 50];
			};
			wrappingView.add(button.modifier).add(button);
			this.scrollView.addChild(wrappingView);

			button.hide = function ()
			{
				this.scrollView.removeChild(wrappingView);
			}.bind(this);
		}

		return button;
	}

	function drawLine(fromPoint, toPoint)
	{
		// console.log(lineIndex + '=' + fromPoint + '-->' + toPoint);
		this.lines[this.lineIndex].setLinePoints(fromPoint, toPoint);
		this.lineIndex = (this.lineIndex + 1) % this.lines.length;
	}

	function createCallstack()
	{

		var callstack = [];
		callstack.push = function ()
		{
			for (var i = 0, l = arguments.length; i < l; i++)
			{
				this[this.length] = arguments[i];
				console.log(this[this.length - 2], this[this.length - 1]);
				if (this.length >= 2)
				{
					drawLine(this[this.length - 2], this[this.length - 1]);
				}
			}
			return this.length;
		};

		return callstack;
	}

	function setCameraState(cameraMode)
	{
		var transition = {duration: 500, curve: Easing.inOutQuad};
		if (cameraMode == "2D")
		{
			//noinspection JSCheckFunctionSignatures
			this.cameraModifier.state.set(0, transition);
		}
		else
		{
			//noinspection JSCheckFunctionSignatures
			this.cameraModifier.state.set(1, transition);
		}
	}

	var labelAngles = [
		-Math.PI / 4,
		Math.PI / 4
	];

	function label(object, text, labelIndex)
	{
		if (labelIndex == undefined)
		{
			labelIndex = 0;
		}

		var angle = labelAngles[labelIndex];

		var labelSurface = objectFactory.makeLabelSurface(text);
		objectFactory.makePositionable(labelSurface);
		labelSurface.renderController = new RenderController();
		labelSurface.renderController.show(labelSurface);

		if (object.labels == undefined || object.labels[labelIndex] == undefined)
		{
			var labelLine = new LineCanvas({opacityRange: [1, 1]});


			var updatePosition;
			updatePosition = function ()
			{
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

			labelLine.setLineObjects(object, labelSurface);

			object.on('positionChange', function ()
			{
				updatePosition();
				labelLine.update();
			});

			object.labels = [];
			object.labels[labelIndex] = [labelSurface];
		}
		else
		{
			var labelViews = object.labels[labelIndex];
			var lastView = labelViews[labelViews.length - 1];

			updatePosition = function ()
			{
				var objectPos = Vector.fromArray(lastView.calculatePosition());
				var objectSize = Vector.fromArray(lastView.getSize());
				var labelPos = objectPos.add(new Vector(0, objectSize.y, 0));
				labelSurface.setPosition(labelPos.toArray());
			};

			updatePosition();
			object.on('positionChange', function ()
			{
				updatePosition();
			});

			node = this.mainNode.add(labelSurface.modifier);
			node.add(labelSurface);
			labelSurface.setMaxSize([100, true]);
			labelViews.push(labelSurface);
		}
		labelSurface.setMaxSize([400, 0]);
	}

	function say(text)
	{
		var textSurface = objectFactory.makeSurface(text, 'blank');

		textSurface.setProperties({maxWidth:"300px"});
		textSurface.setSize([300, true]);
		textSurface.pipe(this.scrollView);
		this.scrollView.addChild(textSurface);
	}

	function makeScrollview()
	{
		var scrollView = new Scrollview();
		scrollView.children = [];
		scrollView.sequenceFrom(scrollView.children);

		scrollView.removeChild = function (child)
		{

			for (var i = 0; i < this.children.length; i++)
			{
				if (this.children[i] == child)
				{
					break;
				}
			}
			this.children.splice(i, 1);
		};

		scrollView.removeAllChildren = function ()
		{
			this.children.splice(0, this.children.length);
		};

		scrollView.addChild = function (child)
		{
			child.parent = this;
			this.children.push(child);
		};

		scrollView.modifier = new Modifier({
			size:[300,undefined],
			transform: Transform.translate(0, 20, 0)});

		return scrollView;
	}

    function testStretch()
    {
        var stretchy = new StretchyLayout({
            size: [300, 300],
            position: [0, 0, 0],
            viewAlign: [0.5, 0.5]
        });
        stretchy.setPosition([-100, -100, 0]);
        stretchy.setAlign([0.5, 0.5]);
        stretchy.setOrigin([0.5, 0.5]);

        var factory = new ObjectFactory();

        function makepv(text) {
            var pv = new PositionableView();
            pv.surface = factory.makeSurface(text);
            pv.add(pv.surface);

            pv.surface.on('click', function () {
                if (pv._stretchConfig.weight == 1)
                    pv._stretchConfig.weight = 2;
                else
                    pv._stretchConfig.weight = 1;

                stretchy.reflow([300, 200]);
            });
            return pv;
        };

        var pv1 = makepv("PV1");
        var pv2 = makepv("PV2");
        var pv3 = makepv("PV3");

        stretchy.addChild(pv1, {weight: 1, targetSize: [200, 120], minSize: [200, 20]});
        stretchy.addChild(pv2, {weight: 2, targetSize: [200, 250], minSize: [200, 20]});
        stretchy.addChild(pv3, {weight: 1, targetSize: [200, 130], minSize: [200, 20]});

        rootNode.add(stretchy.getModifier()).add(stretchy);
        var s = stretchy.measure([300,200]);
        stretchy.layout(s.minimumSize);
    }



	init();
});
























