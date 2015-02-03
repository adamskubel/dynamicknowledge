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

	var SurfaceWrappingView = require('./PositioningLayouts/SurfaceWrappingView');

	var currentScene = 0;
	var objectFactory = new ObjectFactory();

	var memoryConfig = {
		pageSize: 16
	};

    var rootNode;
	var dynamicNodes;
	var mainLayout;
    var strings = {};

	function init()
	{
		this.context = Engine.createContext(null);

		this.processes = {};
		this.pages = {};

		this.lines = [];
		this.lineIndex = 0;
		this.dynamicNodes = [];
		dynamicNodes = this.dynamicNodes;

		var mainView = new View();
		this.mainNode = mainView.add(new Modifier({
			align: [0.5,0.5],
			origin: [0.5,0.5]
		})).add(this.cameraModifier);

		this.context.add(mainView);

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



		for (var i = 0; i < 60; i++)
		{
			var newLine = new LineCanvas();
			this.lines.push(newLine);
			this.mainNode.add(newLine.getModifier()).add(newLine);
		}

		//this.scrollView = makeScrollview();
		//var scrollWrapperView = new View();
		//scrollWrapperView.add(this.scrollView.modifier).add(this.scrollView);

		//var nextButton = objectFactory.makeButtonView("CameraMode");
		//nextButton.setSize([300, 100]);
		//var wrappingView = new View();
		//wrappingView.add(nextButton.modifier).add(nextButton);
		//this.scrollView.addChild(wrappingView);

        rootNode = this.mainNode;
		mainLayout = new StretchyLayout({
			direction:0,
			viewSpacing:[100,0]
		});

		//mainLayout.add(objectFactory.makeSurface('','outline'));
		rootNode.add(mainLayout.getModifier()).add(mainLayout);
		dynamicNodes.push(mainLayout);

		setCameraState("2D");

		Engine.on('prerender',function(){
			for (var i=0;i<dynamicNodes.length;i++)
			{
				var dn = dynamicNodes[i];
				if (mainLayout.needsLayout())
				{
					var sizes = dn.measure();
					dn.layout(sizes.minimumSize);
				}
			}
		});

        nextScene.call(this);
	}

	var nextButton;
	var textLayout;

	var scenes = [
		function ()
		{

			textLayout = new StretchyLayout({
				direction: 1,
				viewOrigin: [0,0.5]
			});

			var textSurface = (new ObjectFactory()).makeLabelSurface("");
			var wrapSurface = new SurfaceWrappingView(textSurface,{size: [400,200]});

			textLayout.addChild(wrapSurface,{weight:2});

			nextButton = objectFactory.makeButtonView("Next");
			nextButton.setSize([200, 80]);
			var wrappingView = new SurfaceWrappingView(nextButton,{size:[0,100]});

			textLayout.addChild(wrappingView);

			nextButton.on('click', function (){
			    nextScene.call(this);
			}.bind(this));

			mainLayout.addChild(textLayout,{weight:1, align:'center'});
			textLayout.add(new Modifier({transform:Transform.translate(0,0,-1)})).add(objectFactory.makeSurface('','outline'));

			mainLayout.requestLayout();

            loadTextAsync("string1.txt", function(text){
                textSurface.setText(text);
                textLayout.requestLayout();
            });
		},
		function ()
		{
            var scene2 = "Actually, the truth is that the memory is the process uses isn't real!<br/>" +
                "The value of a pointer has no direct relationship to physical memory. Instead, the kernel maps this address into a physical address on the fly." +
                "<br/>But this mapping isn't just a simple translation! It's a complex process that enables efficient allocation and security, while simultaneously not sacrificing performance.";


			var textView = new SurfaceWrappingView(objectFactory.makeLabelSurface(scene2),{size: [400,200]});
            textLayout.addChild(textView,{weight: 1, index:1});

		},
        function ()
        {
            var virtualMemorySpace = new PositionableView({
                size:[100,800]
            });

            var layout = new HeaderFooterLayout({
                headerSize:30,
                footerSize:30
            });

            virtualMemorySpace.add(layout);

            layout.header.add(objectFactory.makeLabelView("0x00000000"));
            layout.content.add(objectFactory.makeSurface('','outline'));
            layout.footer.add(objectFactory.makeLabelView("0xFFFFFFFF"));

            label(virtualMemorySpace,"This is the virtual memory space of a 32-bit process");



            var scene2 = "What the process uses is <b>virtual memory</b>, meaning it uses a <b>virtual memory space</b>. " +
                "The virtual memory space is defined as [0,2^64] for a 64 bit system. While this space in continuous and unbroken, only a small subset of will map to an actual physical memory block.";


            var textView = new SurfaceWrappingView(objectFactory.makeLabelSurface(scene2),{size: [400,200]});

            textLayout.addChild(textView,{weight: 1, index:textLayout.children.length-1});

            mainLayout.addChild(virtualMemorySpace);
        },
        function ()
        {
            var virtualMemory = new MemoryPagingView({
                position:[400,0],
                startAddress:0,
                pageCount:16,
                origin: [0.5,0.5]
            });

            var scene2 = "Meow!";

            var textView = new SurfaceWrappingView(objectFactory.makeLabelSurface(scene2),{size: [400,200]});

            textLayout.addChild(textView,{weight: 1, index:textLayout.children.length-1});

            mainLayout.addChild(virtualMemory);
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

    function loadTextAsync(name, callback)
    {
        jQuery.get('./'+name, function(data) {
            callback(data);
        });


        //var client = new XMLHttpRequest();
        //client.open('GET', './string1.txt');
        //client.onreadystatechange = function() {
        //    strings.string1 = client.responseText;
        //    if (client.readyState == 4) {
        //        nextScene.call(this);
        //    }
        //}.bind(this);
        //
        //client.send();
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
		else if (cameraMode == "3D")
		{
			//noinspection JSCheckFunctionSignatures
			this.cameraModifier.state.set(1, transition);
		}
        this.cameraMode = cameraMode;
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
    //
	//function makeScrollview()
	//{
	//	var scrollView = new Scrollview();
	//	scrollView.children = [];
	//	scrollView.sequenceFrom(scrollView.children);
    //
	//	scrollView.removeChild = function (child)
	//	{
    //
	//		for (var i = 0; i < this.children.length; i++)
	//		{
	//			if (this.children[i] == child)
	//			{
	//				break;
	//			}
	//		}
	//		this.children.splice(i, 1);
	//	};
    //
	//	scrollView.removeAllChildren = function ()
	//	{
	//		this.children.splice(0, this.children.length);
	//	};
    //
	//	scrollView.addChild = function (child)
	//	{
	//		child.parent = this;
	//		this.children.push(child);
	//	};
    //
	//	scrollView.modifier = new Modifier({
	//		size:[300,undefined],
	//		transform: Transform.translate(0, 20, 0)});
    //
	//	return scrollView;
	//}

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
























