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