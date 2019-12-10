<!DOCTYPE html>
<html lang="en">
	<head>
	<meta charset="utf-8" />
	<title>shards :: create</title>
	<link rel="stylesheet" href="../links/fonts.css" />
	<link rel="stylesheet" href="style.css" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	</head>
	<body onload="reset.reset();">

		<div id="wrapper" class="create">

			<nav id="navigation">
				<ul>
					<li><a href="index.php">Create</a></li>
					<li><a href="edit.php">Edit</a></li>
					<li><a href="../" target="_blank">Log</a></li>
				</ul>
			</nav>

			<?

			// Function to insert a new string at the top of the file
			function prepend($string, $orig_filename) {
				$context = stream_context_create();
				$orig_file = fopen($orig_filename, 'r', 1, $context);

				$temp_filename = tempnam(sys_get_temp_dir(), 'php_prepend_');
				file_put_contents($temp_filename, $string);
				file_put_contents($temp_filename, $orig_file, FILE_APPEND);

				fclose($orig_file);
				unlink($orig_filename);
				rename($temp_filename, $orig_filename);
				chmod($orig_filename, 0644);
			}

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

			if($_POST['Create']){
			// If a new shard is created, make backups, open the file, update the date and add the shard at the top of the file.
				make_backups();
				$open = "../shards/shards.txt";
				$isoDate = new DateTime('now', new DateTimeZone('Europe/Paris'));
				$text = $isoDate->format('Y-m-d\TH:i:sP') . "   " . $_POST['create'] . "\n";
				prepend($text, $open);

				echo "<p>Shard created. <a href=\"javascript:history.go(-1)\">Back</a> / <a href=\"../\">Home</a></p>";

			}else{
			// Else, display the form to input a new shard.
				$isoDate = new DateTime('now', new DateTimeZone('Europe/Paris'));
				echo "<form action=\"\" method=\"post\" id=\"reset\">";
					echo "<textarea id=\"create_content\" onkeydown=\"if(event.keyCode===9){var v=this.value,s=this.selectionStart,e=this.selectionEnd;this.value=v.substring(0, s)+'\t'+v.substring(e);this.selectionStart=this.selectionEnd=s+1;return false;}\" Name=\"create\">";
					echo "</textarea>";
					echo "<input name=\"Create\" type=\"submit\" value=\"Post new shard\" id=\"create\"/>\n
				</form>";
			}
			?>
		</div>
	</body>
</html>
