Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System; using System.IO; using System.Drawing;
public static class CapricornIcon {
 public static void Create(string source,string target){int[] sizes={16,32,48,64,128,256};using(var image=Image.FromFile(source))using(var file=File.Create(target))using(var writer=new BinaryWriter(file)){
 writer.Write((ushort)0);writer.Write((ushort)1);writer.Write((ushort)sizes.Length);int offset=6+16*sizes.Length;
 foreach(int n in sizes){int length=40+n*n*4+((n+31)/32)*4*n;writer.Write((byte)(n==256?0:n));writer.Write((byte)(n==256?0:n));writer.Write((ushort)0);writer.Write((ushort)1);writer.Write((ushort)32);writer.Write(length);writer.Write(offset);offset+=length;}
 foreach(int n in sizes)using(var bitmap=new Bitmap(n,n)){using(var graphics=Graphics.FromImage(bitmap)){graphics.InterpolationMode=System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;graphics.DrawImage(image,0,0,n,n);}writer.Write(40);writer.Write(n);writer.Write(n*2);writer.Write((ushort)1);writer.Write((ushort)32);writer.Write(0);writer.Write(n*n*4);writer.Write(0);writer.Write(0);writer.Write(0);writer.Write(0);for(int y=n-1;y>=0;y--)for(int x=0;x<n;x++){Color c=bitmap.GetPixel(x,y);writer.Write(c.B);writer.Write(c.G);writer.Write(c.R);writer.Write(c.A);}writer.Write(new byte[((n+31)/32)*4*n]);}
 }}
}
"@
[CapricornIcon]::Create((Join-Path $PSScriptRoot '../build/icon.png'),(Join-Path $PSScriptRoot '../build/icon.ico'))
Copy-Item -LiteralPath (Join-Path $PSScriptRoot '../build/icon.ico') -Destination (Join-Path $PSScriptRoot '../desktop/icon.ico') -Force
