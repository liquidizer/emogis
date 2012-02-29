X="`ls *.png | sed -e s/.png//`"
OPT="-scale 20x20 -channel Alpha -evaluate Multiply"
for file in $X
do
    convert $file.png $OPT 1 overlay/$file-0.png
    convert $file.png $OPT .9 overlay/$file-1.png
    convert $file.png $OPT .8 overlay/$file-2.png
    convert $file.png $OPT .7 overlay/$file-3.png
    convert $file.png $OPT .6 overlay/$file-4.png
    convert $file.png $OPT .5 overlay/$file-5.png
    convert $file.png $OPT .4 overlay/$file-6.png
    convert $file.png $OPT .3 overlay/$file-7.png
    convert $file.png $OPT .2 overlay/$file-8.png
    convert $file.png $OPT .1 overlay/$file-9.png
done