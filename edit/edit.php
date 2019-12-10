<!DOCTYPE html>
<html lang="en">
	<head>
	<meta charset="utf-8" />
	<title>shards :: edit</title>
	<link rel="stylesheet" href="../links/fonts.css" />
	<link rel="stylesheet" href="style.css" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	</head>
	<body>
		<div id="wrapper" class="edit">

			<nav id="navigation">
				<ul>
					<li><a href="index.php">Create</a></li>
					<li><a href="edit.php">Edit</a></li>
					<li><a href="../" target="_blank">Log</a></li>
				</ul>
			</nav>

			<?
			function make_backups() {
				if (file_exists("../shards/backup4.txt")) {
					copy("../shards/backup4.txt", "../shards/backup5.txt");
				};
				if (file_exists("../shards/backup3.txt")) {
					copy("../shards/backup3.txt", "../shards/backup4.txt");
				};
				if (file_exists("../shards/backup2.txt")) {
					copy("../shards/backup2.txt", "../shards/backup3.txt");
				};
				if (file_exists("../shards/backup1.txt")) {
					copy("../shards/backup1.txt", "../shards/backup2.txt");
				};
				copy("../shards/shards.txt", "../shards/backup1.txt");
			}

			if($_POST['Submit']){
			// If the existing file is manually updated, make backups first and write changes.
				make_backups();
				$open = fopen("../shards/shards.txt","w+");
				$text = $_POST['update'];
				fwrite($open, $text);
				fclose($open);
			// Display the changes. Not sure if it's really useful...
				echo "<p>File updated. <a href=\"javascript:history.go(-1)\">Back</a> / <a href=\"../\">Home</a></p>";
				echo "<p>File content:</p>";
				$file = file("../shards/shards.txt");
				foreach($file as $text) {
					echo $text."<br />";
				}
			}else{
			// Display timestamp utilities
				$isoDate = new DateTime('now', new DateTimeZone('Europe/Paris'));
			?>

			<div class="utils">
				<!-- Text field to display the timestamp, with automatic selection-->
				<input type="text" value="<? echo $isoDate->format('Y-m-d\TH:i:sP') ?>" onClick="this.setSelectionRange(0, this.value.length)" id="timefield">
				<!-- Button to copy the timestamp to clipboard (doesn't work on iOS!) -->
				<button onclick="copyToClipboard()" id="copy">Copy</button>
				<!-- Button to hard refresh the page -->
				<button onClick="window.location.reload(true)" id="refresh">Refresh</button>
			</div>

			<?
			// And display the form for manual edition
			$file = file("../shards/shards.txt");
			echo "<form action=\"\" method=\"post\">";
				echo "<textarea id=\"update\" onkeydown=\"if(event.keyCode===9){var v=this.value,s=this.selectionStart,e=this.selectionEnd;this.value=v.substring(0, s)+'\t'+v.substring(e);this.selectionStart=this.selectionEnd=s+1;return false;}\" Name=\"update\">";
				foreach($file as $text) {
					echo $text;
				}
				echo "</textarea>";
				echo "<input name=\"Submit\" type=\"submit\" value=\"Update\" id=\"submit\"/>\n
			</form>";
			}
			?>

		</div>
		<script>

		/* Copy text to cliboard function */
		function copyToClipboard() {
		  /* Get the text field */
		  var copyTime = document.getElementById("timefield");
		  /* Select the text field */
		  copyTime.select();
		  /* Copy the text inside the text field */
		  document.execCommand("copy");
		}

		</script>
	</body>
</html>
