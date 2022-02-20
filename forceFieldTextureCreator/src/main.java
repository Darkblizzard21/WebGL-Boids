import java.io.File;

public class main {
    public static void main(String[] args) {
        String inPath = ".\\input\\qInput6.png";
        String outPath = ".\\mediaOut\\qOutput10.png";
        ForceFieldGen ffg = new ForceFieldGen(new File(inPath));
        ffg.enableCircularLila();
        ffg.gen();
        ffg.save(new File(outPath));
    }
}
